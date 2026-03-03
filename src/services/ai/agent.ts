import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

export class AdsBrainAgent {
    private supabase: any
    private orgId: string

    constructor(supabaseClient: any, orgId: string) {
        this.supabase = supabaseClient
        this.orgId = orgId
    }

    async generateDailyInsights() {
        const today = new Date().toISOString().split('T')[0]

        // A. Sales (Hotmart)
        const { data: sales } = await this.supabase
            .from('sales')
            .select('amount, status')
            .eq('organization_id', this.orgId)
            .gte('created_at', today)

        const approvedSales = sales?.filter((s: any) => s.status === 'approved' || s.status === 'complete') || []
        const totalRevenue = approvedSales.reduce((acc: number, s: any) => acc + Number(s.amount), 0)

        // B. Ad Spend (Meta)
        const { data: campaigns } = await this.supabase
            .from('campaigns')
            .select('name, spend, impressions, clicks, ctr, cpc')
            .eq('organization_id', this.orgId)
            .gt('spend', 0)

        const totalSpend = campaigns?.reduce((acc: number, c: any) => acc + Number(c.spend), 0) || 0
        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0

        if (totalSpend === 0 && totalRevenue === 0) {
            return []
        }

        // Generate insights with Claude
        const insightsFromAI = await this.generateWithClaude({
            totalRevenue,
            totalSpend,
            roas,
            campaigns: campaigns || [],
            salesCount: approvedSales.length,
        })

        // Save to DB
        if (insightsFromAI.length > 0) {
            const { error } = await this.supabase.from('insights').insert(
                insightsFromAI.map((i: any) => ({ ...i, organization_id: this.orgId }))
            )
            if (error) console.error('[AdsBrainAgent] Failed to save insights:', error)
        }

        return insightsFromAI
    }

    private async generateWithClaude(data: {
        totalRevenue: number
        totalSpend: number
        roas: number
        campaigns: any[]
        salesCount: number
    }) {
        const { totalRevenue, totalSpend, roas, campaigns, salesCount } = data

        const prompt = `Você é um analista de marketing digital especializado em Meta Ads para o mercado brasileiro.
Analise os dados do dia e gere insights concisos em JSON.

## Dados do Dia
- Receita aprovada: R$ ${totalRevenue.toFixed(2)} (${salesCount} vendas)
- Investimento em ads: R$ ${totalSpend.toFixed(2)}
- ROAS: ${roas.toFixed(2)}x
- Campanhas ativas: ${campaigns.length}
${campaigns.length > 0 ? `- Top campanhas por gasto:\n${campaigns.slice(0, 5).map((c: any) => `  • ${c.name}: R$ ${Number(c.spend).toFixed(2)} (CTR: ${Number(c.ctr || 0).toFixed(2)}%)`).join('\n')}` : ''}

Gere exatamente 2-3 insights em JSON array com este formato:
[
  {
    "type": "daily_summary" | "campaign_recommendation" | "alert",
    "title": "título curto (max 60 chars)",
    "content": "análise em markdown (2-4 linhas, prática e direta)",
    "action_type": "info" | "scale" | "pause" | "optimize",
    "status": "unread",
    "data_snapshot": { "roas": ${roas.toFixed(2)}, "spend": ${totalSpend.toFixed(2)}, "revenue": ${totalRevenue.toFixed(2)} }
  }
]

Responda APENAS com o JSON array, sem texto extra.`

        try {
            const message = await anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            })

            const content = message.content[0]
            if (content.type !== 'text') return this.fallbackInsights(data)

            // Extract JSON from response
            const text = content.text.trim()
            const jsonMatch = text.match(/\[[\s\S]*\]/)
            if (!jsonMatch) return this.fallbackInsights(data)

            const parsed = JSON.parse(jsonMatch[0])
            return Array.isArray(parsed) ? parsed : this.fallbackInsights(data)
        } catch (e) {
            console.error('[AdsBrainAgent] Claude error, using fallback:', e)
            return this.fallbackInsights(data)
        }
    }

    private fallbackInsights(data: { totalRevenue: number; totalSpend: number; roas: number }) {
        const { totalRevenue, totalSpend, roas } = data
        const insights = []

        if (totalSpend > 0) {
            insights.push({
                type: 'daily_summary',
                title: `Resumo do Dia: ROAS ${roas.toFixed(2)}x`,
                content: `Investimento de **R$ ${totalSpend.toFixed(2)}** com receita de **R$ ${totalRevenue.toFixed(2)}**.`,
                action_type: 'info',
                status: 'unread',
                data_snapshot: { roas, spend: totalSpend, revenue: totalRevenue },
            })
        }

        if (roas > 2.5) {
            insights.push({
                type: 'campaign_recommendation',
                title: 'Oportunidade de Escala',
                content: `ROAS em ${roas.toFixed(2)}x. Considere aumentar o orçamento das campanhas de melhor performance.`,
                action_type: 'scale',
                status: 'unread',
                data_snapshot: { roas },
            })
        } else if (totalSpend > 100 && roas < 0.5) {
            insights.push({
                type: 'alert',
                title: 'Alerta: ROAS Crítico',
                content: `Retorno de apenas ${roas.toFixed(2)}x com R$ ${totalSpend.toFixed(2)} investidos. Revise urgentemente as campanhas ativas.`,
                action_type: 'pause',
                status: 'unread',
                data_snapshot: { roas },
            })
        }

        return insights
    }
}
