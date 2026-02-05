import { createClient } from '@/lib/supabase/server'

const FB_API_VERSION = 'v19.0'
const FB_BASE_URL = 'https://graph.facebook.com'

export interface MetaTokenResponse {
    access_token: string
    token_type: string
    expires_in: number
}

export interface MetaAdAccount {
    id: string
    account_id: string
    name: string
    currency: string
    timezone_name: string
}

export class MetaService {
    private accessToken: string

    constructor(token: string) {
        this.accessToken = token
    }

    static getAuthUrl(state: string, redirectUri: string) {
        const clientId = process.env.META_CLIENT_ID
        const scope = 'ads_read,ads_management,read_insights' // Ajustar escopos conforme necessário
        return `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`
    }

    static async exchangeCodeForToken(code: string, redirectUri: string): Promise<MetaTokenResponse> {
        const clientId = process.env.META_CLIENT_ID
        const clientSecret = process.env.META_CLIENT_SECRET

        const res = await fetch(`${FB_BASE_URL}/${FB_API_VERSION}/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`)

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error?.message || 'Failed to exchange token')
        }

        return res.json()
    }

    async getAdAccounts(): Promise<MetaAdAccount[]> {
        // Busca contas de anúncio do usuário
        // Campos: name, currency, timezone_name
        const res = await fetch(`${FB_BASE_URL}/${FB_API_VERSION}/me/adaccounts?fields=name,account_id,currency,timezone_name&access_token=${this.accessToken}`)

        if (!res.ok) {
            console.error(await res.json())
            return []
        }

        const json = await res.json()
        return json.data || []
    }

    async getInsights(adAccountId: string, datePreset = 'last_7d') {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
        const fields = 'campaign_name,clicks,spend,impressions,cpc,ctr,roas,actions'

        const res = await fetch(`${FB_BASE_URL}/${FB_API_VERSION}/${accountId}/insights?date_preset=${datePreset}&fields=${fields}&access_token=${this.accessToken}`)

        if (!res.ok) {
            console.error(await res.json())
            return []
        }

        const json = await res.json()
        return json.data || []
    }
}
