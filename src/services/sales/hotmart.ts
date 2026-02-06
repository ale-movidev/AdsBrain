import { createAdminClient } from "@/lib/supabase/admin"
import { HotmartWebhookBody } from "./types"

/**
 * Normalizes Hotmart status to our internal simplified status
 */
export function normalizeStatus(hotmartStatus: string): string {
    const map: Record<string, string> = {
        APPROVED: 'approved',
        COMPLETE: 'approved',
        REFUNDED: 'refunded',
        CHARGEBACK: 'chargeback',
        CANCELLED: 'cancelled',
        EXPIRED: 'cancelled'
    }
    return map[hotmartStatus] || 'pending'
}

export async function processHotmartEvent(payload: HotmartWebhookBody, organizationId: string, integrationId: string) {
    const supabase = createAdminClient()

    const { data } = payload
    const { purchase, buyer, product } = data

    const saleData = {
        integration_id: integrationId,
        organization_id: organizationId,
        external_id: purchase.transaction,
        product_name: product.name,
        status: normalizeStatus(purchase.status),
        amount: purchase.price.value,
        currency: purchase.price.currency_code,
        customer_email: buyer.email,
        created_at: new Date(purchase.order_date).toISOString(), // Hotmart sends milliseconds usually
        processed_at: new Date().toISOString()
    }

    // Upsert sale to handle updates (e.g. APPROVED -> REFUNDED)
    const { error } = await supabase
        .from('sales')
        .upsert(saleData, { onConflict: 'external_id' })

    if (error) {
        console.error('Error processing Hotmart event:', error)
        throw new Error(`Failed to save sale: ${error.message}`)
    }

    return { success: true, transaction: purchase.transaction }
}
