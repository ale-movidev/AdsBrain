'use server'

import { createClient } from '@/lib/supabase/server'
import { MetaService } from '@/services/meta/service'
import { AdsBrainAgent } from '@/services/ai/agent'
import { revalidatePath } from 'next/cache'

export async function triggerManualSync() {
    try {
        const supabase = await createClient()

        // 1. Get User Org
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: orgMember } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        const orgId = orgMember?.organization_id
        if (!orgId) return { error: 'No organization found' }

        // 2. Fetch Active Integrations
        const { data: integrations } = await supabase
            .from('integrations')
            .select('*')
            .eq('organization_id', orgId)
            .eq('status', 'active')

        if (integrations) {
            for (const integration of integrations) {
                // A. Sync Meta Ads
                if (integration.provider === 'meta_ads') {
                    const metaService = new MetaService(integration.access_token)
                    const adAccounts = await metaService.getAdAccounts()

                    for (const account of adAccounts) {
                        const { data: dbAccount } = await supabase.from('ad_accounts').upsert({
                            integration_id: integration.id,
                            organization_id: integration.organization_id,
                            external_id: account.id,
                            name: account.name,
                            currency: account.currency,
                            timezone: account.timezone_name
                        }, { onConflict: 'external_id' }).select().single()

                        if (dbAccount) {
                            const campaigns = await metaService.getCampaigns(account.id)
                            for (const camp of campaigns) {
                                await supabase.from('campaigns').upsert({
                                    ad_account_id: dbAccount.id,
                                    organization_id: integration.organization_id,
                                    external_id: camp.id,
                                    name: camp.name,
                                    status: camp.status,
                                    daily_budget: camp.daily_budget ? Number(camp.daily_budget) / 100 : null,
                                }, { onConflict: 'external_id' })
                            }
                            // Sync Insights (Last 3 days for safety)
                            const insights = await metaService.getInsights(account.id, 'campaign', 'last_3d')
                            for (const insight of insights) {
                                if (!insight.campaign_id) continue;
                                await supabase.from('campaigns').update({
                                    spend: Number(insight.spend || 0),
                                    impressions: Number(insight.impressions || 0),
                                    clicks: Number(insight.clicks || 0),
                                    cpc: Number(insight.cpc || 0),
                                    ctr: Number(insight.ctr || 0),
                                }).eq('external_id', insight.campaign_id)
                            }
                        }
                    }
                }
            }
        }

        // 3. Run AI Agent
        const agent = new AdsBrainAgent(supabase, orgId)
        await agent.generateDailyInsights()

        // 4. Revalidate
        revalidatePath('/dashboard')

        return { success: true }
    } catch (error: any) {
        console.error('Manual Sync Error:', error)
        return { error: error.message || 'Failed to sync' }
    }
}
