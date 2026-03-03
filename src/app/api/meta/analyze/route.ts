import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const { campaigns, totalRevenue } = await req.json()

        if (!campaigns || campaigns.length === 0) {
            return NextResponse.json({ error: 'Sem dados de campanhas para analisar.' }, { status: 400 })
        }

        const totalSpend = campaigns.reduce((acc: number, c: any) => acc + Number(c.spend || 0), 0)
        const totalClicks = campaigns.reduce((acc: number, c: any) => acc + Number(c.clicks || 0), 0)
        const totalImpressions = campaigns.reduce((acc: number, c: any) => acc + Number(c.impressions || 0), 0)
        const roas = totalSpend > 0 && totalRevenue > 0 ? (totalRevenue / totalSpend).toFixed(2) : 'não disponível'
        const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'
        const avgCPC = campaigns.filter((c: any) => Number(c.cpc) > 0)
            .reduce((acc: number, c: any, _: any, arr: any[]) => acc + Number(c.cpc) / arr.length, 0).toFixed(2)

        const campaignList = campaigns.map((c: any) => ({
            nome: c.name,
            status: c.status,
            gasto: `R$ ${Number(c.spend || 0).toFixed(2)}`,
            impressoes: Number(c.impressions || 0).toLocaleString('pt-BR'),
            cliques: Number(c.clicks || 0).toLocaleString('pt-BR'),
            ctr: `${Number(c.ctr || 0).toFixed(2)}%`,
            cpc: `R$ ${Number(c.cpc || 0).toFixed(2)}`,
            orcamentoDiario: c.daily_budget ? `R$ ${Number(c.daily_budget).toFixed(2)}` : 'não definido',
        }))

        const prompt = `Você é um especialista em marketing digital e análise de Meta Ads (Facebook/Instagram Ads). Analise os dados de campanhas abaixo e forneça insights acionáveis em português brasileiro.

## Dados Gerais
- Total investido: R$ ${totalSpend.toFixed(2)}
- Receita total: ${totalRevenue > 0 ? `R$ ${Number(totalRevenue).toFixed(2)}` : 'não disponível'}
- ROAS geral: ${roas}
- Total de impressões: ${totalImpressions.toLocaleString('pt-BR')}
- Total de cliques: ${totalClicks.toLocaleString('pt-BR')}
- CTR médio: ${avgCTR}%
- CPC médio: R$ ${avgCPC}

## Campanhas (${campaigns.length} no total)
${JSON.stringify(campaignList, null, 2)}

## Sua análise deve incluir:

### 1. Diagnóstico Geral (2-3 parágrafos)
Avalie o desempenho geral do conjunto de campanhas. O ROAS está bom? O CTR é saudável para o mercado brasileiro? O CPC está competitivo?

### 2. Campanhas em Destaque
Identifique as 2-3 campanhas com melhor performance e explique por quê merecem mais atenção/investimento.

### 3. Campanhas com Problemas
Identifique campanhas com baixo desempenho (alto gasto, CTR baixo, CPC alto) e sugira ações específicas (pausar, ajustar criativos, revisar público).

### 4. Recomendações Acionáveis
Liste 3-5 ações concretas que o gestor pode tomar AGORA para melhorar o ROAS e reduzir o custo por resultado. Seja específico.

### 5. Alertas
Identifique qualquer sinal de alerta (campanhas com spend alto e sem performance, orçamento diário muito baixo, etc.).

Responda em markdown formatado, de forma direta e prática. Evite jargões desnecessários.`

        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        })

        const content = message.content[0]
        if (content.type !== 'text') {
            return NextResponse.json({ error: 'Resposta inválida da IA.' }, { status: 500 })
        }

        return NextResponse.json({ analysis: content.text })
    } catch (error: any) {
        console.error('[Meta Analyze] Error:', error)
        return NextResponse.json({ error: error.message || 'Erro ao analisar campanhas.' }, { status: 500 })
    }
}
