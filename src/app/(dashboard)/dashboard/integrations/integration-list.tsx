'use client'

import { useState } from 'react'
import { PlusCircle, CheckCircle2, AlertCircle } from "lucide-react"
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
} from "@/components/ui/dialog"
import { HotmartTutorialSheet } from "./hotmart-tutorial"

interface Integration {
    id: string
    provider: string
    name: string
    status: string
    organization_id: string
}

export function IntegrationList({ existingIntegrations, orgId }: { existingIntegrations: Integration[], orgId: string | null }) {
    const [integrations, setIntegrations] = useState(existingIntegrations)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

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

            if (result?.error) {
                setError(result.error)
            } else if (result?.success && result.data) {
                setIntegrations([...integrations, result.data])
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado.')
        } finally {
            setIsLoading(false)
        }
    }

    const getHotmartUrl = (intId: string) => {
        if (typeof window === 'undefined') return ''
        return `${window.location.origin}/api/webhooks/hotmart?orgId=${orgId}&integrationId=${intId}`
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
                                <Button variant="outline" className="w-full mb-2" disabled>Configurado</Button>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={async () => {
                                        const intId = integrations.find(i => i.provider === 'hotmart')?.id
                                        if (!intId) return
                                        const confirm = window.confirm('Deseja importar as vendas dos últimos 12 meses? Isso pode levar alguns segundos.')
                                        if (!confirm) return

                                        setIsLoading(true)
                                        try {
                                            const res = await triggerHistoricalSync(intId)
                                            if ('error' in res) {
                                                setError(res.error)
                                            } else {
                                                alert(`Importação concluída! Processados: ${res.processed}, Erros: ${res.errors}`)
                                            }
                                        } finally {
                                            setIsLoading(false)
                                        }
                                    }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Importando...' : 'Importar Histórico (12 meses)'}
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
                                            {isLoading ? 'Salvando...' : 'Salvar Integração'}
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
                            <Button variant="outline" className="w-full" disabled>Conectado</Button>
                        ) : (
                            <div className="w-full">
                                {/* We use specific route for Meta OAuth */}
                                <Button className="w-full bg-[#0668E1] hover:bg-[#0668E1]/90 text-white" onClick={() => window.location.href = '/auth/meta'}>
                                    Conectar Meta Ads
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
