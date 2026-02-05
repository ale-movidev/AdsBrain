import { createClient } from '@/lib/supabase/server'

export class AdsBrainAgent {
    private supabase: any
    private orgId: string

    constructor(supabaseClient: any, orgId: string) {
        this.supabase = supabaseClient
        this.orgId = orgId
    }

    async generateDailyInsights() {
        // 1. Fetch Data Snapshot
        const today = new Date().toISOString().split('T')[0]

        // A. Sales (Hotmart)
        const { data: sales } = await this.supabase
            .from('sales')
            .select('amount, status')
            .eq('organization_id', this.orgId)
            .gte('created_at', today)

        const totalRevenue = sales?.reduce((acc: number, sale: any) => acc + Number(sale.amount), 0) || 0

        // B. Ad Spend (Meta)
        // Note: We need to sum up campaign spend for today. 
        // Assumption: campaigns table 'spend' is updated by Cron with "Last 3 Days" or "Today" window.
        // For MVP we might rely on the last fetched values.
        const { data: campaigns } = await this.supabase
            .from('campaigns')
            .select('name, spend, impressions, clicks')
            .eq('organization_id', this.orgId)
            .gt('spend', 0)

        const totalSpend = campaigns?.reduce((acc: number, camp: any) => acc + Number(camp.spend), 0) || 0

        // 2. Analyze
        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
        const insights = []

        // Insight 1: Global ROAS
        if (totalSpend > 0) {
            insights.push({
                type: 'daily_summary',
                title: `Resumo do Dia: ROAS ${roas.toFixed(2)}`,
                content: `Hoje você investiu **R$ ${totalSpend.toFixed(2)}** e faturou **R$ ${totalRevenue.toFixed(2)}**.`,
                action_type: 'info',
                status: 'unread',
                data_snapshot: { totalSpend, totalRevenue, roas }
            })
        }

        // Insight 2: Scaling / Warning
        if (roas > 2.5) {
            insights.push({
                type: 'campaign_recommendation',
                title: `🚀 Oportunidade de Escala`,
                content: `O ROAS está alto (${roas.toFixed(2)}). Considere aumentar o orçamento das campanhas com melhor performance.`,
                action_type: 'scale',
                status: 'unread',
                data_snapshot: { roas }
            })
        } else if (totalSpend > 100 && roas < 0.5) {
            insights.push({
                type: 'alert',
                title: `⚠️ Alerta de Prejuízo`,
                content: `O retorno está baixo hoje. Verifique campanhas com alto custo e sem vendas.`,
                action_type: 'pause',
                status: 'unread',
                data_snapshot: { roas }
            })
        }

        // 3. Save Insights
        if (insights.length > 0) {
            const { error } = await this.supabase.from('insights').insert(
                insights.map(i => ({ ...i, organization_id: this.orgId }))
            )

            if (error) console.error('Failed to save insights', error)
        }

        return insights
    }
}
