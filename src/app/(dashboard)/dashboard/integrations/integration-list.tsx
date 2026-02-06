'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createIntegration, triggerHistoricalSync } from './actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { HotmartTutorialSheet } from "./hotmart-tutorial"

interface Integration {
    id: string
    provider: string
    name: string
    status: string
    organization_id: string
    credentials?: any
}

export function IntegrationList({ existingIntegrations, orgId }: { existingIntegrations: Integration[], orgId: string | null }) {
    const [integrations, setIntegrations] = useState(existingIntegrations)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [origin, setOrigin] = useState('')
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
    const [isSuccessOpen, setIsSuccessOpen] = useState(false)
    const [importStats, setImportStats] = useState({ processed: 0, errors: 0, skipped: 0 })
    const [importProvider, setImportProvider] = useState<string | null>(null)

    useEffect(() => {
        setOrigin(window.location.origin)
    }, [])

    const handleConnect = async (provider: string, name: string, formData?: FormData) => {
        setIsLoading(true)
        setError('')

        try {
            const data = new FormData()
            data.append('provider', provider)
            data.append('name', name)
            if (formData) {
                // Merge form data
                const clientId = formData.get('client_id');
                const clientSecret = formData.get('client_secret');
                const basicToken = formData.get('basic_token');

                if (clientId) data.append('client_id', clientId);
                if (clientSecret) data.append('client_secret', clientSecret);
                if (basicToken) data.append('basic_token', basicToken);
            }

            const result = await createIntegration(data)
            console.log('Integration update result:', result)

            if (result?.error) {
                setError(result.error)
            } else if (result?.success && result.data) {
                setIntegrations(prev => {
                    const exists = prev.find(i => i.id === result.data.id)
                    if (exists) {
                        return prev.map(i => i.id === result.data.id ? result.data : i)
                    }
                    return [...prev, result.data]
                })
                setIsEditOpen(false) // Close on success
            }
        } catch (err) {
            console.error(err)
            setError('Ocorreu um erro inesperado.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleImportHistory = async () => {
        if (!importProvider) return
        const intId = integrations.find(i => i.provider === importProvider)?.id
        if (!intId) return

        setIsLoading(true)
        try {
            const res = await triggerHistoricalSync(intId)
            if ('error' in res) {
                setError(res.error)
            } else {
                setIsImportConfirmOpen(false) // Close confirm modal
                setImportStats({
                    processed: res.processed,
                    errors: res.errors,
                    skipped: res.skipped || 0
                })
                setIsSuccessOpen(true)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const getHotmartUrl = (intId: string) => {
        if (!origin) return ''
        return `${origin}/api/webhooks/hotmart?orgId=${orgId}&integrationId=${intId}`
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Hotmart Card */}
                <Card className="flex flex-col border-l-4 border-l-[#F04E23]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Hotmart</CardTitle>
                        <CardDescription>Plataforma de vendas</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground mb-4">
                            Conecte para importar vendas e reembolsos automaticamente via Webhook.
                        </p>
                        {integrations.find(i => i.provider === 'hotmart') ? (
                            <div className="space-y-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Conectado
                                </Badge>
                                <div className="p-2 bg-muted rounded-md text-xs break-all border font-mono">
                                    {getHotmartUrl(integrations.find(i => i.provider === 'hotmart')!.id)}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-muted-foreground mr-2">Copie a URL</p>
                                    <HotmartTutorialSheet webhookUrl={getHotmartUrl(integrations.find(i => i.provider === 'hotmart')!.id)} />
                                </div>
                            </div>
                        ) : (
                            <Badge variant="secondary">Não conectado</Badge>
                        )}
                    </CardContent>
                    <CardFooter>
                        {integrations.find(i => i.provider === 'hotmart') ? (
                            <div className="w-full space-y-2">
                                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full mb-2">Editar Conexão</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Editar Conexão Hotmart</DialogTitle>
                                            <DialogDescription>
                                                Atualize suas credenciais para permitir a importação de dados.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form action={async (formData) => {
                                            setIsLoading(true);
                                            await handleConnect('hotmart', 'Minha Hotmart', formData);
                                        }} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Client ID</label>
                                                <input name="client_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Ex: e64f8c..." required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Client Secret</label>
                                                <input name="client_secret" type="password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Ex: a1b2c3..." required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Basic Token (Opcional)</label>
                                                <input name="basic_token" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Basic ..." />
                                                <p className="text-[10px] text-muted-foreground">Se já tiver o token Basic gerado.</p>
                                            </div>
                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Salvando...
                                                    </>
                                                ) : 'Atualizar Integração'}
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => {
                                        setImportProvider('hotmart')
                                        setIsImportConfirmOpen(true)
                                    }}
                                    disabled={isLoading}
                                >
                                    {isLoading && importProvider === 'hotmart' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importando...
                                        </>
                                    ) : 'Importar Histórico (12 meses)'}
                                </Button>
                            </div>
                        ) : (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full">Conectar Hotmart</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Conectar Hotmart</DialogTitle>
                                        <DialogDescription>
                                            Integre suas vendas em tempo real e importe dados passados.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form action={async (formData) => {
                                        setIsLoading(true);
                                        await handleConnect('hotmart', 'Minha Hotmart', formData);
                                        // Wait handling logic is in handleConnect
                                    }} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Client ID</label>
                                            <input
                                                name="client_id"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                placeholder="Ex: e64f8c..."
                                                required
                                                defaultValue={integrations.find(i => i.provider === 'hotmart')?.credentials?.client_id}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Client Secret</label>
                                            <input name="client_secret" type="password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Ex: a1b2c3..." required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Basic Token (Opcional)</label>
                                            <input name="basic_token" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Basic ..." />
                                            <p className="text-[10px] text-muted-foreground">Se já tiver o token Basic gerado.</p>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Salvando...
                                                </>
                                            ) : 'Salvar Integração'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardFooter>
                </Card>

                {/* Meta Ads Card */}
                <Card className="flex flex-col border-l-4 border-l-[#0668E1]">
                    <CardHeader>
                        <CardTitle>Meta Ads</CardTitle>
                        <CardDescription>Facebook & Instagram</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground mb-4">
                            Conecte para importar campanhas, conjuntos e anúncios.
                        </p>
                        <Badge variant="secondary">Em breve</Badge>
                    </CardContent>
                    <CardFooter>
                        {integrations.find(i => i.provider === 'meta_ads') ? (
                            <div className="w-full space-y-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 w-full justify-center mb-2">
                                    <CheckCircle2 className="w-3 h-3" /> Conectado
                                </Badge>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full">Editar Conexão</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Editar Conexão Meta Ads</DialogTitle>
                                            <DialogDescription>
                                                Atualize seu Token de Acesso ou ID da Conta.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form action={async (formData) => {
                                            setIsLoading(true);
                                            await handleConnect('meta_ads', 'Meta Ads', formData);
                                        }} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Access Token</label>
                                                <input name="access_token" type="password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="EAAB..." required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none">Ad Account ID</label>
                                                <input name="ad_account_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="act_..." required defaultValue={integrations.find(i => i.provider === 'meta_ads')?.credentials?.ad_account_id} />
                                            </div>
                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Salvando...
                                                    </>
                                                ) : 'Atualizar Integração'}
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="secondary"
                                    className="w-full mt-2"
                                    onClick={() => {
                                        setImportProvider('meta_ads')
                                        setIsImportConfirmOpen(true)
                                    }}
                                    disabled={isLoading}
                                >
                                    {isLoading && importProvider === 'meta_ads' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sincronizando...
                                        </>
                                    ) : 'Sincronizar (30 dias)'}
                                </Button>
                            </div>
                        ) : (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-[#0668E1] hover:bg-[#0668E1]/90 text-white">
                                        Conectar Meta Ads
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Conectar Meta Ads</DialogTitle>
                                        <DialogDescription>
                                            Insira seu Token de Acesso e ID da Conta de Anúncios.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form action={async (formData) => {
                                        setIsLoading(true);
                                        await handleConnect('meta_ads', 'Meta Ads', formData);
                                    }} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Access Token</label>
                                            <input name="access_token" type="password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="EAAB..." required />
                                            <p className="text-[10px] text-muted-foreground">Token de "System User" ou Long-lived User Token.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Ad Account ID</label>
                                            <input name="ad_account_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="act_123456789" required />
                                            <p className="text-[10px] text-muted-foreground">O ID da conta de anúncios (começa com act_).</p>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Conectando...
                                                </>
                                            ) : 'Salvar e Conectar'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* Shared Dialogs */}
            <Dialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar {importProvider === 'hotmart' ? 'Importação' : 'Sincronização'}</DialogTitle>
                        <DialogDescription>
                            {importProvider === 'hotmart'
                                ? 'Deseja realmente importar as vendas dos últimos 12 meses? Isso pode levar alguns segundos.'
                                : 'Deseja sincronizar as campanhas e custos dos últimos 30 dias?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportConfirmOpen(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleImportHistory} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : 'Sim, Continuar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="flex flex-col items-center justify-center space-y-4 pt-4">
                        <div className="rounded-full bg-green-100 p-3 animate-in zoom-in duration-300">
                            <CheckCircle2 className="h-12 w-12 text-green-600 animate-pulse" />
                        </div>
                        <DialogTitle className="text-xl text-center">Sucesso!</DialogTitle>
                        <DialogDescription className="text-center">
                            {importProvider === 'hotmart'
                                ? 'O histórico de vendas foi processado com sucesso.'
                                : 'As campanhas foram sincronizadas com sucesso.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-green-50 p-3 text-center">
                            <span className="text-2xl font-bold text-green-600">{importStats.processed}</span>
                            <span className="text-xs text-muted-foreground">Processados</span>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 p-3 text-center">
                            <span className="text-2xl font-bold text-slate-600">{importStats.skipped}</span>
                            <span className="text-xs text-muted-foreground">Ignorados</span>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-lg bg-red-50 p-3 text-center">
                            <span className="text-2xl font-bold text-red-600">{importStats.errors}</span>
                            <span className="text-xs text-muted-foreground">Erros</span>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button
                            className="w-full sm:w-auto min-w-[120px] bg-green-600 hover:bg-green-700"
                            onClick={() => setIsSuccessOpen(false)}
                        >
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
