'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { triggerManualSync } from './actions'
const handleSync = async () => {
    setIsSyncing(true)
    try {
        const result = await triggerManualSync()
        if (result.success) {
            // Feedback visual simple
            console.log('Sync complete')
        } else {
            console.error(result.error)
            alert('Erro ao sincronizar: ' + result.error)
        }
    } catch (e) {
        console.error(e)
        alert('Erro de conexão')
    } finally {
        setIsSyncing(false)
    }
}

return (
    <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
        className="gap-2"
    >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Atualizando...' : 'Sincronizar Dados'}
    </Button>
)
}
