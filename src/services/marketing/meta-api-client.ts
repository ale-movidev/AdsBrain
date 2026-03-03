
interface MetaInsight {
    campaign_id: string
    campaign_name: string
    spend: string
    impressions: string
    clicks: string
    cpc?: string
    cpm?: string
    actions?: any[] // purchases are here
    date_start: string
    date_stop: string
}


export class MetaApiClient {
    private accessToken: string
    private adAccountId: string
    private apiVersion = 'v19.0'

    constructor(accessToken: string, adAccountId: string) {
        this.accessToken = accessToken
        // Garante o prefixo act_ exigido pela Graph API
        this.adAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
    }

    private async fetch(endpoint: string, params: Record<string, string> = {}) {
        const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${endpoint}`)
        url.searchParams.append('access_token', this.accessToken)
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value))

        const res = await fetch(url.toString())
        if (!res.ok) {
            const err = await res.json()
            console.error('Meta API Error:', JSON.stringify(err, null, 2))
            throw new Error(`Meta API Failed: ${err.error?.message || res.statusText}`)
        }
        return res.json()
    }

    /**
     * Get Insights broken down by Campaign for a date range
     */
    async getCampaignInsights(startDate: string, endDate: string) {
        // level=campaign
        // fields=campaign_id,campaign_name,spend,impressions,clicks,cpc,cpm,actions
        // time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}

        const params = {
            level: 'campaign',
            fields: 'campaign_id,campaign_name,spend,impressions,clicks,cpc,cpm,actions',
            time_range: JSON.stringify({ since: startDate, until: endDate }),
            limit: '500'
        }

        // Endpoint: /act_<AD_ACCOUNT_ID>/insights
        const endpoint = `${this.adAccountId}/insights`
        const data = await this.fetch(endpoint, params)
        return data.data as MetaInsight[]
    }

    async getAdAccount() {
        const data = await this.fetch(this.adAccountId, { fields: 'name,currency,account_status' })
        return data
    }
}
