import { createAdminClient } from "@/lib/supabase/admin"
import { MetaApiClient } from "./meta-api-client"

export async function syncMetaCampaigns(integrationId: string, organizationId: string, credentials: any, daysToSync = 30) {
    if (!credentials?.access_token || !credentials?.ad_account_id) {
        throw new Error("Missing Meta Access Token or Ad Account ID")
    }

    const client = new MetaApiClient(
        credentials.access_token,
        credentials.ad_account_id
    )

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysToSync)

    const since = startDate.toISOString().split('T')[0]
    const until = endDate.toISOString().split('T')[0]

    console.log(`[MetaSync] Syncing campaigns from ${since} to ${until} for integration ${integrationId}`)

    const insights = await client.getCampaignInsights(since, until)
    console.log(`[MetaSync] Fetched ${insights.length} campaigns`)

    const supabase = createAdminClient()

    let processedCount = 0
    let errorCount = 0

    for (const campaign of insights) {
        try {
            // Check if we have 'actions' (purchases)
            // actions: [ { action_type: 'purchase', value: '10' } ]
            // We might want to store ROAS or Revenue if the table supports it.
            // For now, focusing on SPEND.

            const campaignData = {
                organization_id: organizationId,
                integration_id: integrationId,
                external_id: campaign.campaign_id,
                name: campaign.campaign_name,
                spend: parseFloat(campaign.spend || '0'),
                status: 'active', // Insights only return active/delivering usually? Or we can fetch status separately.
                updated_at: new Date().toISOString()
            }

            // We assume 'campaigns' table handles upsert on external_id or id?
            // The constraint might be on (organization_id, external_id) or just external_id.
            // Let's iterate and try upsert.

            const { error } = await supabase
                .from('campaigns')
                .upsert(campaignData, { onConflict: 'external_id' })

            if (error) {
                console.error(`[MetaSync] DB Error saving campaign ${campaign.campaign_id}:`, error)
                errorCount++
            } else {
                processedCount++
            }
        } catch (e) {
            console.error(`[MetaSync] Error processing campaign:`, e)
            errorCount++
        }
    }

    return { success: true, processed: processedCount, errors: errorCount, skipped: 0 }
}
