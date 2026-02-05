'use client'

import { useState } from 'react'
import { PlusCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createIntegration } from './actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface Integration {
    id: string
    provider: string
    name: string
    status: string
    organization_id: string
}

export function IntegrationList({ existingIntegrations, orgId }: { existingIntegrations: Integration[], orgId: string | null }) {
    const [integrations, setIntegrations] = useState(existingIntegrations)

    const handleConnect = async (provider: string, name: string) => {
        const formData = new FormData()
        formData.append('provider', provider)
        formData.append('name', name)

        const result = await createIntegration(formData)
        if (result?.success && result.data) {
            setIntegrations([...integrations, result.data])
        }
    }

    const getHotmartUrl = (intId: string) => {
        if (typeof window === 'undefined') return ''
        return `${window.location.origin}/api/webhooks/hotmart?orgId=${orgId}&integrationId=${intId}`
    }

    return (
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
                            <p className="text-[10px] text-muted-foreground">Copie esta URL e configure no Webhook da Hotmart (Eventos: Compra Aprovada, Reembolso).</p>
                        </div>
                    ) : (
                        <Badge variant="secondary">Não conectado</Badge>
                    )}
                </CardContent>
                <CardFooter>
                    {integrations.find(i => i.provider === 'hotmart') ? (
                        <Button variant="outline" className="w-full" disabled>Configurado</Button>
                    ) : (
                        <Button className="w-full" onClick={() => handleConnect('hotmart', 'Minha Hotmart')}>
                            Conectar Hotmart
                        </Button>
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
                    <Button variant="outline" className="w-full" disabled>Conectar Meta</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
