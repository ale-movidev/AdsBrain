'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createIntegration(formData: FormData) {
    const supabase = await createClient()
    const provider = formData.get('provider') as string
    const name = formData.get('name') as string

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get user's organization (Taking the first one for MVP)
    let { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!orgMember) {
        // Auto-create generic organization for MVP
        const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: `${user.email?.split('@')[0]}'s Org`,
                slug: `org-${Date.now()}`,
                owner_id: user.id
            })
            .select()
            .single()

        if (orgError) return { error: `Failed to create org: ${orgError.message}` }

        // Add member
        await supabase.from('organization_members').insert({
            organization_id: newOrg.id,
            user_id: user.id,
            role: 'owner'
        })

        orgMember = { organization_id: newOrg.id }
    }

    const orgId = orgMember.organization_id

    // Create integration
    const { data, error } = await supabase
        .from('integrations')
        .insert({
            organization_id: orgId,
            provider,
            name,
            status: 'active' // For webhooks we just activate and wait for events
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/integrations')
    return { success: true, data }
}

export async function getIntegrations() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Simple join via implicit relation or two steps. 
    // RLS protects us so we can just query integrations (if policies set correctly).
    // Actually policy says "is_org_member", so we just need to ensure user is in org.

    // Let's first finding orgs the user is in to filter (or rely on RLS if we query all)
    // RLS approach:
    const { data, error } = await supabase.from('integrations').select('*')

    if (error) {
        console.error(error)
        return []
    }
    return data
}

export async function getUserOrgId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()
    return data?.organization_id
}
