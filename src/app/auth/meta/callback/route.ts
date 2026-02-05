import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MetaService } from '@/services/meta/service'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const cookieStore = await cookies()
    const savedState = cookieStore.get('oauth_state')?.value

    // Verify State
    if (!state || !savedState || state !== savedState) {
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=csrf_token_mismatch`)
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=no_code`)
    }

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.redirect(`${origin}/login`)
        }

        // Exchange code for token
        const tokenData = await MetaService.exchangeCodeForToken(code, `${origin}/auth/meta/callback`)

        // Get basic user info (or saving the integration directly)
        // We need the org ID.
        const { data: orgMember } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!orgMember) throw new Error('No org found')

        // Upsert Integration
        // "Meta Ads" - we probably want to support multiple accounts? 
        // Usually one "Login" covers multiple Ad Accounts. We store the User Token.
        // Later we list Ad Accounts to "Connect" them.

        await supabase.from('integrations').insert({
            organization_id: orgMember.organization_id,
            provider: 'meta_ads',
            name: 'Meta Ads Account',
            status: 'active',
            // In Prod: Encrypt this token!
            access_token: tokenData.access_token,
            last_synced_at: new Date().toISOString()
        })

        return NextResponse.redirect(`${origin}/dashboard/integrations?success=meta_connected`)

    } catch (error) {
        console.error(error)
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=meta_connection_failed`)
    }
}
