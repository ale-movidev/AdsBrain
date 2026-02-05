import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdsBrainAgent } from '@/services/ai/agent'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const supabase = await createClient()

        // 1. Get all active organizations (or loop through them)
        const { data: orgs } = await supabase.from('organizations').select('id')

        if (!orgs) return NextResponse.json({ message: 'No orgs found' })

        const results = []

        for (const org of orgs) {
            // 2. Instantiate Agent
            const agent = new AdsBrainAgent(supabase, org.id)

            // 3. Generate Insights
            const insights = await agent.generateDailyInsights()

            results.push({ orgId: org.id, insightsCount: insights.length })
        }

        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error('AI Cron Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
