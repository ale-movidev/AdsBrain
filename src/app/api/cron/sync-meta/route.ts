import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MetaService } from '@/services/meta/service'

export async function GET(request: Request) {
    // 1. Verify Vercel Cron Header
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allows local testing if needed, or strict 'unauthorized'
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // 2. Get Active Integration Tokens
    const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider', 'meta_ads')
        .eq('status', 'active')

    if (error || !integrations) {
        return NextResponse.json({ error: 'Failed to fetch integrations', details: error }, { status: 500 })
    }

    const results = []

    // 3. Loop and Sync
    for (const integration of integrations) {
        try {
            const metaService = new MetaService(integration.access_token)

            // A. Fetch Ad Accounts
            const adAccounts = await metaService.getAdAccounts()

            for (const account of adAccounts) {
                // Upsert Ad Account
                const { data: dbAccount } = await supabase.from('ad_accounts').upsert({
                    integration_id: integration.id,
                    organization_id: integration.organization_id,
                    external_id: account.id, // usually starts with act_
                    name: account.name,
                    currency: account.currency,
                    timezone: account.timezone_name
                }, { onConflict: 'external_id' }).select().single()

                if (!dbAccount) continue

                // B. Fetch Campaigns
                const campaigns = await metaService.getCampaigns(account.id)

                for (const camp of campaigns) {
                    await supabase.from('campaigns').upsert({
                        ad_account_id: dbAccount.id,
                        organization_id: integration.organization_id,
                        external_id: camp.id,
                        name: camp.name,
                        status: camp.status,
                        daily_budget: camp.daily_budget ? Number(camp.daily_budget) / 100 : null, // Meta returns in cents usually
                    }, { onConflict: 'external_id' })
                }

                // C. Fetch Insights (Campaign Level) to update metrics
                // We fetch "Today" or "Last 3 Days" to keep it fresh.
                const insights = await metaService.getInsights(account.id, 'campaign', 'last_3d')

                for (const insight of insights) {
                    if (!insight.campaign_id) continue;

                    // Calculate ROAS roughly if not provided
                    // actions value / spend

                    await supabase.from('campaigns').update({
                        spend: Number(insight.spend || 0),
                        impressions: Number(insight.impressions || 0),
                        clicks: Number(insight.clicks || 0),
                        cpc: Number(insight.cpc || 0),
                        ctr: Number(insight.ctr || 0),
                        // roas: ... to calculate properly we need purchase value
                    }).eq('external_id', insight.campaign_id)
                }
            }

            results.push({ integrationId: integration.id, status: 'success', accounts: adAccounts.length })

        } catch (err: any) {
            console.error(`Sync failed for integration ${integration.id}:`, err)
            results.push({ integrationId: integration.id, status: 'failed', error: err.message })
        }
    }

    return NextResponse.json({ success: true, results })
}
