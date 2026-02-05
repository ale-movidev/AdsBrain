import { NextResponse } from 'next/server'
import { MetaService } from '@/services/meta/service'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Generate random state to prevent CSRF and store it (cookie or DB)
    // For MVP, we pass org ID in state or just rely on session cookie logic in callback
    const state = nanoid()

    // Store state in cookie to verify later
    const response = NextResponse.redirect(
        MetaService.getAuthUrl(state, `${new URL(request.url).origin}/auth/meta/callback`)
    )

    response.cookies.set('oauth_state', state, { httpOnly: true, maxAge: 60 * 10 }) // 10 min

    return response
}
