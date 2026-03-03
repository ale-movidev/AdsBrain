'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCampaignsData(from?: string, to?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { campaigns: [], orgId: null }

    const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    const orgId = orgMember?.organization_id
    if (!orgId) return { campaigns: [], orgId: null }

    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, external_id, name, status, spend, impressions, clicks, cpc, ctr, daily_budget, updated_at')
        .eq('organization_id', orgId)
        .order('spend', { ascending: false })

    if (error) {
        console.error('[Campaigns] DB error:', error)
        return { campaigns: [], orgId }
    }

    return { campaigns: campaigns || [], orgId }
}
