import { NextResponse } from 'next/server'
import { processHotmartEvent } from '@/services/sales/hotmart'
import { HotmartWebhookBody } from '@/services/sales/types'
import { createClient } from '@/lib/supabase/server'

// Segredo do Webhook (em produção, validar X-HOTMART-HOTK)
// const HOTMART_SECRET = process.env.HOTMART_WEBHOOK_SECRET

export async function POST(request: Request) {
    try {
        const body = await request.json() as HotmartWebhookBody
        const htoken = request.headers.get('x-hotmart-hottok') // Usado para verificação básica

        // TODO: Recuperar a integração correta baseada no htoken ou query param?
        // Problema: Webhooks da Hotmart são globais por produto, difícil mapear para tenant sem um identificador na URL ou config.
        // Solução Provisória para MVP: Receber `?orgId=...&integrationId=...` na URL do webhook configurado na Hotmart.

        const { searchParams } = new URL(request.url)
        const orgId = searchParams.get('orgId')
        const integrationId = searchParams.get('integrationId')

        if (!orgId || !integrationId) {
            return NextResponse.json({ error: 'Missing orgId or integrationId' }, { status: 400 })
        }

        // Opcional: Validar se a integração existe e está ativa no banco
        const supabase = await createClient()
        const { data: integration } = await supabase
            .from('integrations')
            .select('status')
            .eq('id', integrationId)
            .eq('organization_id', orgId)
            .single()

        if (!integration || integration.status !== 'active') {
            return NextResponse.json({ error: 'Integration inactive or not found' }, { status: 403 })
        }

        // Processar evento
        await processHotmartEvent(body, orgId, integrationId)

        return NextResponse.json({ message: 'Received' })
    } catch (error) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
