import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { SyncButton } from './sync-button'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Get Organization ID
    const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    // Default empty state if no org
    const orgId = orgMember?.organization_id

    // 2. Fetch Data (Parallel)
    // Removed "today" filter to show ALL TIME sales as requested
    // const today = new Date().toISOString().split('T')[0]

    const [salesRes, campaignsRes, insightsRes] = await Promise.all([
        orgId ? supabase.from('sales').select('amount').eq('organization_id', orgId) : { data: [] },
        orgId ? supabase.from('campaigns').select('spend').eq('organization_id', orgId) : { data: [] }, // Spend is cumulative for now or last_3d from cron
        orgId ? supabase.from('insights').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5) : { data: [] }
    ])

    const salesTotal = salesRes.data?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0
    const spendTotal = campaignsRes.data?.reduce((acc: number, curr: any) => acc + Number(curr.spend), 0) || 0

    const roas = spendTotal > 0 ? (salesTotal / spendTotal) : 0
    const insights = insightsRes.data || []

    // Latest "Actionable" Insight
    const latestAction = insights.find((i: any) => i.action_type !== 'info') || insights[0]

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2 mt-4">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <SyncButton />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Vendas (Total)</h3>
                    </div>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salesTotal)}
                    </div>
                    <p className="text-xs text-muted-foreground">Todo o período</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Gasto (Estimado)</h3>
                    </div>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spendTotal)}
                    </div>
                    <p className="text-xs text-muted-foreground">Baseado na última sincronização</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">ROI (ROAS)</h3>
                    </div>
                    <div className={`text-2xl font-bold ${roas >= 2 ? 'text-green-600' : roas < 1 && spendTotal > 0 ? 'text-red-500' : ''}`}>
                        {spendTotal > 0 ? `${roas.toFixed(2)}x` : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-primary">Recomendação IA</h3>
                    </div>
                    {latestAction ? (
                        <div>
                            <p className="text-sm font-bold mt-1 line-clamp-1">{latestAction.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{latestAction.content}</p>
                        </div>
                    ) : (
                        <p className="text-sm font-medium mt-2">Nenhuma recomendação disponível.</p>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                {/* Main Chart Area */}
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h3 className="font-semibold text-lg">Visão Geral</h3>
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed border-2 border-muted rounded-lg mt-4 bg-muted/10">
                            <p className="text-sm">Gráfico de desempenho será ativado após 24h de dados.</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity / Insights */}
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h3 className="font-semibold text-lg">Últimos Insights</h3>
                        <div className="space-y-4 mt-4">
                            {insights.length > 0 ? (
                                insights.map((insight: any) => (
                                    <div key={insight.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className={`h-2 w-2 mt-2 shrink-0 rounded-full ${insight.type === 'alert' ? 'bg-red-500' :
                                            insight.type === 'campaign_recommendation' ? 'bg-green-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{insight.title}</p>
                                            <p className="text-xs text-muted-foreground">{insight.content}</p>
                                            <p className="text-[10px] text-muted-foreground/60 pt-1">
                                                {new Date(insight.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">Sistema iniciado</p>
                                        <p className="text-xs text-muted-foreground">Aguardando processamento de IA.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
