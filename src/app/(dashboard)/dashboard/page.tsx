import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2 mt-4">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                {/* Calendar Widget or Global Filter could go here */}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Vendas Hoje</h3>
                    </div>
                    <div className="text-2xl font-bold">R$ 0,00</div>
                    <p className="text-xs text-muted-foreground">+0% em relação a ontem</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Gasto Hoje</h3>
                    </div>
                    <div className="text-2xl font-bold">R$ 0,00</div>
                    <p className="text-xs text-muted-foreground">+0% em relação a ontem</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">ROI (ROAS)</h3>
                    </div>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Sem dados suficientes</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-primary">Recomendação IA</h3>
                    </div>
                    <p className="text-sm font-medium mt-2">Nenhuma recomendação disponível no momento.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                {/* Main Chart Area */}
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h3 className="font-semibold text-lg">Visão Geral</h3>
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed border-2 border-muted rounded-lg mt-4">
                            Gráfico de Desempenho (Em breve)
                        </div>
                    </div>
                </div>

                {/* Recent Activity / Insights */}
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h3 className="font-semibold text-lg">Últimos Insights</h3>
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Sistema iniciado</p>
                                    <p className="text-xs text-muted-foreground">Aguardando integração de dados.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
