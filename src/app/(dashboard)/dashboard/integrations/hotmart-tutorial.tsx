'use client'

import { Copy, ExternalLink, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useState } from "react"

export function HotmartTutorialSheet({ webhookUrl }: { webhookUrl: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-8 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="w-4 h-4" />
                    Como configurar?
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md md:max-w-[540px]">
                <SheetHeader>
                    <SheetTitle>Configuração Hotmart</SheetTitle>
                    <SheetDescription>
                        Siga o passo a passo para conectar suas vendas automaticamente.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
                    <div className="space-y-6">

                        {/* Visual Step 1 */}
                        <div className="rounded-lg border bg-muted/40 p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                    1
                                </div>
                                <h3 className="font-medium text-sm">Copie sua URL de Webhook</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 text-xs font-mono bg-background border p-2 rounded truncate">
                                    {webhookUrl}
                                </div>
                                <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            {copied && <p className="text-xs text-green-600 mt-1">Copiado!</p>}
                        </div>

                        <Separator />

                        {/* Step 2 */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border font-bold text-sm">
                                    2
                                </div>
                                <h3 className="font-medium text-sm">Acesse a Hotmart Developers</h3>
                            </div>
                            <p className="text-sm text-muted-foreground ml-11">
                                Vá para a área de configuração de Webhooks na plataforma da Hotmart.
                            </p>
                            <div className="ml-11">
                                <Button asChild variant="outline" size="sm" className="gap-2">
                                    <a href="https://app.hotmart.com/tools/webhook" target="_blank" rel="noopener noreferrer">
                                        Abrir Ferramentas Hotmart <ExternalLink className="w-3 h-3" />
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border font-bold text-sm">
                                    3
                                </div>
                                <h3 className="font-medium text-sm">Adicione a Configuração</h3>
                            </div>

                            <Accordion type="single" collapsible className="ml-11">
                                <AccordionItem value="item-1" className="border-none">
                                    <AccordionTrigger className="py-2 hover:no-underline text-xs bg-muted/50 px-3 rounded-md">
                                        Ver detalhes da configuração
                                    </AccordionTrigger>
                                    <AccordionContent className="p-3 bg-muted/30 rounded-md mt-2 text-sm space-y-2">
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            <li>Clique em <strong>Cadastrar Webhook</strong>.</li>
                                            <li><strong>Nome da Configuração:</strong> AdsBrain (ou nome de sua preferência).</li>
                                            <li><strong>Produto:</strong> Selecione "Todos os produtos" ou os específicos.</li>
                                            <li><strong>URL para envio de dados:</strong> Cole a URL copiada no Passo 1.</li>
                                            <li><strong>Versão:</strong> 1.0.0 (Recomendado).</li>
                                            <li><strong>Eventos para enviar:</strong> Marque <u>Compra Aprovada</u>, <u>Compra Reembolsada</u>, <u>Compra Cancelada</u>, <u>Troca de Plano</u>.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/* Step 4 */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border font-bold text-sm">
                                    4
                                </div>
                                <h3 className="font-medium text-sm">Teste e Salve</h3>
                            </div>
                            <p className="text-sm text-muted-foreground ml-11">
                                Clique em "Realizar teste de envio". Se der sucesso (Status 200), clique em Salvar.
                                Em instantes, as vendas começarão a aparecer no Dashboard.
                            </p>
                        </div>

                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
