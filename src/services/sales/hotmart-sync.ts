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
    if (sales.length > 0) {
        console.log('Sample Sale Object:', JSON.stringify(sales[0], null, 2))
    }

    const supabase = createAdminClient()

    let processedCount = 0
    let errorCount = 0
    let skippedCount = 0

    // Process in batches if necessary, but Upsert is fast
    for (const sale of sales) {
        try {
            const transactionId = sale.transaction || (sale as any).purchase?.transaction || (sale as any).transaction_code || (sale as any).code

            if (!transactionId) {
                console.error(`Sale missing transaction ID:`, JSON.stringify(sale))
                errorCount++
                continue
            }

            // Defensive checks for nested objects
            const buyerEmail = (sale.buyer && sale.buyer.email) || (sale as any).buyer_email || 'unknown@email.com'
            const purchaseDate = sale.purchase?.order_date || (sale as any).purchase_date || Date.now()
            const productName = sale.product?.name || (sale as any).product_name || 'Unknown Product'
            const priceValue = sale.purchase?.price?.value || (sale as any).price?.value || 0
            const currencyCode = sale.purchase?.price?.currency_code || (sale as any).price?.currency_code || 'BRL'

            if (!sale.buyer?.email && !(sale as any).buyer_email) {
                console.warn(`[Sync] Sale ${transactionId} missing buyer email. Using placeholder.`)
            }

            console.log(`[Sync] Processing transaction: ${transactionId} | Status: ${sale.status} | Value: ${priceValue}`)

            const saleData = {
                integration_id: integrationId,
                organization_id: organizationId,
                external_id: transactionId,
                product_name: productName,
                status: normalizeStatus(sale.purchase?.status || sale.status),
                amount: priceValue,
                currency: currencyCode,
                customer_email: buyerEmail,
                created_at: new Date(purchaseDate).toISOString(),
                processed_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('sales')
                .upsert(saleData, { onConflict: 'external_id' })

            if (error) {
                console.error(`[Sync] DB Error saving sale ${transactionId}:`, error)
                errorCount++
            } else {
                processedCount++
            }
        } catch (e) {
            console.error(`[Sync] Unknown error processing sale:`, e)
            errorCount++
        }
    }

    return { success: true, processed: processedCount, errors: errorCount, skipped: skippedCount }
}
