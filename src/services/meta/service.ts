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

export interface MetaCampaign {
    id: string
    name: string
    status: string
    daily_budget?: string
    lifetime_budget?: string
}

export interface MetaInsight {
    campaign_id?: string
    ad_id?: string
    clicks: string
    spend: string
    impressions: string
    cpc?: string
    ctr?: string
    roas?: string // Custom metric or derived
    actions?: any[]
    date_start: string
    date_stop: string
}

export class MetaService {
    private accessToken: string

    constructor(token: string) {
        this.accessToken = token
    }

    static getAuthUrl(state: string, redirectUri: string) {
        const clientId = process.env.META_CLIENT_ID
        const scope = 'ads_read,ads_management,read_insights'
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
        const res = await fetch(`${FB_BASE_URL}/${FB_API_VERSION}/me/adaccounts?fields=name,account_id,currency,timezone_name&access_token=${this.accessToken}`)

        if (!res.ok) {
            console.error(await res.json())
            return []
        }

        const json = await res.json()
        return json.data || []
    }

    async getCampaigns(adAccountId: string): Promise<MetaCampaign[]> {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
        const fields = 'name,status,daily_budget,lifetime_budget'
        const res = await fetch(`${FB_BASE_URL}/${FB_API_VERSION}/${accountId}/campaigns?fields=${fields}&limit=500&access_token=${this.accessToken}`)

        if (!res.ok) {
            console.error(await res.json())
            return []
        }
        const json = await res.json()
        return json.data || []
    }

    async getInsights(adAccountId: string, level: 'account' | 'campaign' | 'ad' = 'campaign', datePreset = 'last_7d'): Promise<MetaInsight[]> {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
        const fields = 'campaign_id,ad_id,clicks,spend,impressions,cpc,ctr,actions' // roas needs action_values usually

        const res = await fetch(`${FB_BASE_URL}/${FB_API_VERSION}/${accountId}/insights?level=${level}&date_preset=${datePreset}&fields=${fields}&limit=500&access_token=${this.accessToken}`)

        if (!res.ok) {
            console.error(await res.json())
            return []
        }

        const json = await res.json()
        return json.data || []
    }
}
