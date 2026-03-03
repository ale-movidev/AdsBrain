'use client'

import { useState, useMemo } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Campaign {
    id: string
    external_id: string
    name: string
    status: string
    spend: number
    impressions: number
    clicks: number
    cpc: number
    ctr: number
    daily_budget: number | null
    updated_at: string
}

interface CampaignsClientProps {
    campaigns: Campaign[]
    totalRevenue: number
}

type SortKey = keyof Pick<Campaign, 'name' | 'spend' | 'impressions' | 'clicks' | 'ctr' | 'cpc'>
type SortDir = 'asc' | 'desc'

function fmt(value: number, type: 'currency' | 'number' | 'percent' = 'number') {
    if (type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    if (type === 'percent') return `${value.toFixed(2)}%`
    return new Intl.NumberFormat('pt-BR').format(value)
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
        active: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
        paused: { label: 'Pausada', className: 'bg-yellow-100 text-yellow-700' },
        archived: { label: 'Arquivada', className: 'bg-gray-100 text-gray-500' },
        deleted: { label: 'Deletada', className: 'bg-red-100 text-red-600' },
    }
    const s = map[status?.toLowerCase()] || { label: status, className: 'bg-gray-100 text-gray-500' }
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (col !== sortKey) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />
    return sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />
}

function renderMarkdown(text: string) {
    // Simple markdown renderer for the AI output
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let key = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.startsWith('### ')) {
            elements.push(<h3 key={key++} className="text-base font-semibold mt-5 mb-2 text-foreground">{line.slice(4)}</h3>)
        } else if (line.startsWith('## ')) {
            elements.push(<h2 key={key++} className="text-lg font-bold mt-6 mb-2 text-foreground">{line.slice(3)}</h2>)
        } else if (line.startsWith('**') && line.endsWith('**')) {
            elements.push(<p key={key++} className="font-semibold text-sm mt-1">{line.slice(2, -2)}</p>)
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            // Inline bold
            const content = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            elements.push(<li key={key++} className="text-sm text-muted-foreground ml-4 my-0.5" dangerouslySetInnerHTML={{ __html: content }} />)
        } else if (/^\d+\./.test(line)) {
            const content = line.replace(/^\d+\.\s*/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            elements.push(<li key={key++} className="text-sm text-muted-foreground ml-4 my-0.5 list-decimal" dangerouslySetInnerHTML={{ __html: content }} />)
        } else if (line.trim() === '') {
            elements.push(<div key={key++} className="h-1" />)
        } else {
            const content = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            elements.push(<p key={key++} className="text-sm text-muted-foreground my-0.5" dangerouslySetInnerHTML={{ __html: content }} />)
        }
    }
    return elements
}

export function CampaignsClient({ campaigns, totalRevenue }: CampaignsClientProps) {
    const [sortKey, setSortKey] = useState<SortKey>('spend')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [analysis, setAnalysis] = useState<string | null>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [aiError, setAiError] = useState<string | null>(null)

    const totalSpend = campaigns.reduce((acc, c) => acc + Number(c.spend || 0), 0)
    const totalImpressions = campaigns.reduce((acc, c) => acc + Number(c.impressions || 0), 0)
    const totalClicks = campaigns.reduce((acc, c) => acc + Number(c.clicks || 0), 0)
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgCPC = campaigns.filter(c => Number(c.cpc) > 0).length > 0
        ? campaigns.filter(c => Number(c.cpc) > 0).reduce((acc, c) => acc + Number(c.cpc), 0) / campaigns.filter(c => Number(c.cpc) > 0).length
        : 0
    const roas = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : null

    const sorted = useMemo(() => {
        return [...campaigns].sort((a, b) => {
            const av = a[sortKey] ?? 0
            const bv = b[sortKey] ?? 0
            if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
            return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av)
        })
    }, [campaigns, sortKey, sortDir])

    function handleSort(key: SortKey) {
        if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('desc') }
    }

    async function handleAnalyze() {
        setAnalyzing(true)
        setAnalysis(null)
        setAiError(null)
        try {
            const res = await fetch('/api/meta/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaigns, totalRevenue }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
            setAnalysis(data.analysis)
        } catch (e: any) {
            setAiError(e.message)
        } finally {
            setAnalyzing(false)
        }
    }

    const thClass = "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
    const th = (label: string, key: SortKey) => (
        <th className={thClass} onClick={() => handleSort(key)}>
            <span className="inline-flex items-center">
                {label}
                <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
            </span>
        </th>
    )

    return (
        <div className="flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Investimento Total</p>
                    <p className="text-2xl font-bold mt-1">{fmt(totalSpend, 'currency')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{campaigns.length} campanhas</p>
                </div>
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Impressões</p>
                    <p className="text-2xl font-bold mt-1">{fmt(totalImpressions)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total acumulado</p>
                </div>
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliques</p>
                    <p className="text-2xl font-bold mt-1">{fmt(totalClicks)}</p>
                    <p className="text-xs text-muted-foreground mt-1">CTR médio: {fmt(avgCTR, 'percent')}</p>
                </div>
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">CPC Médio</p>
                    <p className="text-2xl font-bold mt-1">{avgCPC > 0 ? fmt(avgCPC, 'currency') : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Custo por clique</p>
                </div>
                <div className={`rounded-xl border p-5 shadow-sm ${roas !== null ? (roas >= 2 ? 'bg-green-50 border-green-200' : roas < 1 ? 'bg-red-50 border-red-200' : 'bg-card') : 'bg-card'}`}>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">ROAS</p>
                    <p className={`text-2xl font-bold mt-1 ${roas !== null ? (roas >= 2 ? 'text-green-700' : roas < 1 ? 'text-red-600' : '') : ''}`}>
                        {roas !== null ? `${roas.toFixed(2)}x` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {roas !== null ? (roas >= 2 ? '✓ Acima da meta' : roas < 1 ? '⚠ Abaixo do break-even' : 'Monitorar') : 'Sem dados de vendas'}
                    </p>
                </div>
            </div>

            {/* Campaigns Table + AI */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h3 className="font-semibold text-base">Campanhas Meta Ads</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Dados da última sincronização</p>
                    </div>
                    <Button
                        onClick={handleAnalyze}
                        disabled={analyzing || campaigns.length === 0}
                        className="gap-2"
                    >
                        {analyzing ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Analisando...</>
                        ) : (
                            <><Brain className="h-4 w-4" /> Analisar com IA</>
                        )}
                    </Button>
                </div>

                {campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium">Nenhuma campanha encontrada</p>
                        <p className="text-xs">Conecte sua conta Meta Ads em <strong>Integrações</strong> e faça uma sincronização.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 border-b">
                                <tr>
                                    {th('Campanha', 'name')}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    {th('Gasto', 'spend')}
                                    {th('Impressões', 'impressions')}
                                    {th('Cliques', 'clicks')}
                                    {th('CTR', 'ctr')}
                                    {th('CPC', 'cpc')}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Orç. Diário</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sorted.map((campaign) => {
                                    const ctrVal = Number(campaign.ctr || 0)
                                    const ctrGood = ctrVal >= 1.5
                                    const ctrBad = ctrVal < 0.5 && Number(campaign.impressions) > 1000
                                    return (
                                        <tr key={campaign.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium max-w-[220px]">
                                                <span className="line-clamp-2 leading-snug">{campaign.name}</span>
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={campaign.status} /></td>
                                            <td className="px-4 py-3 font-medium">{fmt(Number(campaign.spend || 0), 'currency')}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmt(Number(campaign.impressions || 0))}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmt(Number(campaign.clicks || 0))}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 font-medium ${ctrGood ? 'text-green-600' : ctrBad ? 'text-red-500' : 'text-foreground'}`}>
                                                    {ctrGood ? <TrendingUp className="h-3.5 w-3.5" /> : ctrBad ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                                                    {fmt(ctrVal, 'percent')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{Number(campaign.cpc) > 0 ? fmt(Number(campaign.cpc), 'currency') : '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{campaign.daily_budget ? fmt(Number(campaign.daily_budget), 'currency') : '—'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* AI Analysis Panel */}
            {(analysis || aiError) && (
                <div className={`rounded-xl border shadow-sm overflow-hidden ${aiError ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50/30'}`}>
                    <div className={`flex items-center gap-2 px-6 py-4 border-b ${aiError ? 'border-red-200' : 'border-blue-200'}`}>
                        <Brain className={`h-5 w-5 ${aiError ? 'text-red-500' : 'text-blue-600'}`} />
                        <h3 className="font-semibold text-base">{aiError ? 'Erro na análise' : 'Análise de IA — Claude'}</h3>
                    </div>
                    <div className="px-6 py-5">
                        {aiError ? (
                            <p className="text-sm text-red-600">{aiError}</p>
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                {renderMarkdown(analysis!)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
