import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { SyncButton } from './sync-button'
import { subDays, format, startOfMonth } from 'date-fns'

interface DashboardPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage(props: DashboardPageProps) {
    const searchParams = await props.searchParams
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

    const orgId = orgMember?.organization_id

    // 2. Parse Date Filters
    const fromParam = typeof searchParams.from === 'string' ? searchParams.from : undefined
    const toParam = typeof searchParams.to === 'string' ? searchParams.to : undefined

    // Default to "This Month" if not specified, or "Last 30 Days"
    // Let's match the Picker default: Last 30 Days if empty
    // 3. Date Filter Logic
    // If URL params exist, use them. 
    // If NOT, default to "Last 30 Days" used to be the case, but user wants to see history.
    // Let's stick to explicit params for filtering. If no params, SHOW ALL?
    // User expectation for "Dashboard": usually "This Month" or "Last 30 Days".
    // But for "Imported History", they want to see it.
    // Let's change default to:
    // If no params => "All Time" (effectively).
    // Or better: The DatePicker controls this. 

    // CURRENT: defaultFrom = subDays(new Date(), 30).
    // CHANGE: Let's rely on searchParams. If empty, NO FILTER on start date.

    const startDate = fromParam ? new Date(fromParam).toISOString() : null
    const endDate = toParam ? new Date(toParam + 'T23:59:59.999Z').toISOString() : new Date().toISOString()

    // 4. Fetch Data with Filters
    // Sales: Filter by created_at
    let salesQuery = supabase.from('sales').select('amount, status, created_at').eq('organization_id', orgId)

    if (startDate) salesQuery = salesQuery.gte('created_at', startDate)
    if (endDate) salesQuery = salesQuery.lte('created_at', endDate)

    // Campaigns: Cannot filter by date yet (schema limitation). Fetch all.
    const campaignsQuery = supabase.from('campaigns').select('spend').eq('organization_id', orgId)

    // Insights: Filter by creation?
    let insightsQuery = supabase.from('insights').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10)
    if (fromParam) insightsQuery = insightsQuery.gte('created_at', startDate)

    const [salesRes, campaignsRes, insightsRes] = await Promise.all([
        orgId ? salesQuery : { data: [] },
        orgId ? campaignsQuery : { data: [] },
        orgId ? insightsQuery : { data: [] }
    ])

    // 4. Calculate Metrics
    const salesData = salesRes.data || []
    console.log(`Dashboard Debug: OrgId=${orgId}, SalesFetched=${salesData.length}`)
    if ('error' in salesRes && salesRes.error) console.error('Sales Query Error:', salesRes.error)

    // Metrics
    const approvedSales = salesData.filter((s: any) => s.status === 'approved' || s.status === 'complete')
    const refundedSales = salesData.filter((s: any) => s.status === 'refunded' || s.status === 'chargeback' || s.status === 'cancelled') // Cancelled might not be refunded money, but lost sale. 
    // Usually Cancelled = $0 revenue, but might not be a refund deduction if it never cleared.
    // Let's stick to "Refunded/Chargeback" for money RETURNED.
    const moneyReturnedEvents = salesData.filter((s: any) => s.status === 'refunded' || s.status === 'chargeback')

    const netRevenue = approvedSales.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)
    const refundsTotal = moneyReturnedEvents.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)
    const grossRevenue = netRevenue + refundsTotal // Only if we assume approved rows + refunded rows are disjoint. 
    // IF status updates in place: An item is EITHER approved OR refunded.
    // So Gross was (Approved + Refunded).

    const totalRevenueDisplay = netRevenue // Usually Dashboard shows Net
    const salesCount = approvedSales.length
    const avgTicket = salesCount > 0 ? (netRevenue / salesCount) : 0

    // Campaign Spend (Static/Cumulative)
    const spendTotal = campaignsRes.data?.reduce((acc: number, curr: any) => acc + Number(curr.spend), 0) || 0

    const roas = spendTotal > 0 ? (netRevenue / spendTotal) : 0
    const insights = insightsRes.data || []
    const latestAction = insights.find((i: any) => i.action_type !== 'info') || insights[0]

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 mt-4 gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex flex-col sm:flex-row items-center space-x-2 gap-2">
                    <DateRangePicker />
                    <SyncButton />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Net Revenue */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Receita Líquida</h3>
                    </div>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {salesCount} vendas aprovadas
                    </p>
                </div>

                {/* Spend */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Investimento (Ads)</h3>
                    </div>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spendTotal)}
                    </div>
                    <p className="text-xs text-muted-foreground">Baseado na última sincronização</p>
                </div>

                {/* ROAS */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">ROI (ROAS)</h3>
                    </div>
                    <div className={`text-2xl font-bold ${roas >= 2 ? 'text-green-600' : roas < 1 && spendTotal > 0 ? 'text-red-500' : ''}`}>
                        {spendTotal > 0 ? `${roas.toFixed(2)}x` : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
                </div>

                {/* Refunds / Details */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Reembolsos</h3>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(refundsTotal)}
                    </div>
                    <p className="text-xs text-muted-foreground">Ticket Médio: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket)}</p>
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
