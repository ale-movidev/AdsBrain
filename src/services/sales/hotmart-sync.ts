import { createAdminClient } from "@/lib/supabase/admin"
import { HotmartApiClient } from "./hotmart-api"
import { normalizeStatus } from "./hotmart"

export async function syncHotmartHistory(integrationId: string, organizationId: string, credentials: any, monthsToBackfill = 12) {
    if (!credentials?.client_id || !credentials?.client_secret) {
        throw new Error("Missing Client ID or Secret")
    }

    const client = new HotmartApiClient(
        credentials.client_id,
        credentials.client_secret,
        credentials.basic_token
    )

    const endDate = new Date().getTime()
    const startDate = new Date().setMonth(new Date().getMonth() - monthsToBackfill)

    console.log(`Starting Hotmart Sync for Integration ${integrationId} from ${new Date(startDate).toISOString()} to ${new Date(endDate).toISOString()}`)

    const sales = await client.getSalesHistory(startDate, endDate)
    console.log(`Fetched ${sales.length} sales from Hotmart`)

    const supabase = createAdminClient()

    let processedCount = 0
    let errorCount = 0

    // Process in batches if necessary, but Upsert is fast
    for (const sale of sales) {
        try {
            const saleData = {
                integration_id: integrationId,
                organization_id: organizationId,
                external_id: sale.transaction,
                product_name: sale.product.name,
                status: normalizeStatus(sale.status),
                amount: sale.purchase.price.value,
                currency: sale.purchase.price.currency_code,
                customer_email: sale.buyer.email,
                created_at: new Date(sale.purchase.order_date).toISOString(),
                processed_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('sales')
                .upsert(saleData, { onConflict: 'external_id' })

            if (error) {
                console.error(`Error saving sale ${sale.transaction}:`, error)
                errorCount++
            } else {
                processedCount++
            }
        } catch (e) {
            console.error(`Error processing sale ${sale.transaction}:`, e)
            errorCount++
        }
    }

    return { success: true, processed: processedCount, errors: errorCount }
}
