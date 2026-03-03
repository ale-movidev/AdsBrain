import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { CampaignsClient } from '@/components/domain/campaigns-client'
import { Suspense } from 'react'

interface PageProps {
    searchParams: Promise<{ from?: string; to?: string }>
}

export default async function CampaignsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    const orgId = orgMember?.organization_id

    // Fetch campaigns
    const { data: campaigns } = orgId
        ? await supabase
            .from('campaigns')
            .select('id, external_id, name, status, spend, impressions, clicks, cpc, ctr, daily_budget, updated_at')
            .eq('organization_id', orgId)
            .order('spend', { ascending: false })
        : { data: [] }

    // Fetch total revenue (approved sales) for ROAS calculation
    const startDate = params.from ? new Date(params.from).toISOString() : null
    const endDate = params.to ? new Date(params.to + 'T23:59:59.999Z').toISOString() : new Date().toISOString()

    let salesQuery = supabase
        .from('sales')
        .select('amount, status')
        .eq('organization_id', orgId)
        .in('status', ['approved', 'complete'])

    if (startDate) salesQuery = salesQuery.gte('created_at', startDate)
    if (endDate) salesQuery = salesQuery.lte('created_at', endDate)

    const { data: sales } = orgId ? await salesQuery : { data: [] }
    const totalRevenue = sales?.reduce((acc, s: any) => acc + Number(s.amount || 0), 0) || 0

    const lastSync = campaigns && campaigns.length > 0
        ? new Date(campaigns[0].updated_at).toLocaleString('pt-BR')
        : null

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Campanhas Meta Ads</h2>
                    {lastSync && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Última sincronização: {lastSync}
                        </p>
                    )}
                </div>
                <Suspense>
                    <DateRangePicker />
                </Suspense>
            </div>

            {!orgId && (
                <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                    ⚠️ Você precisa fazer parte de uma organização. Configure em <strong>Integrações</strong>.
                </div>
            )}

            <CampaignsClient
                campaigns={(campaigns || []) as any}
                totalRevenue={totalRevenue}
            />
        </div>
    )
}
