export interface HotmartWebhookBody {
    id: string
    creation_date: number
    event: 'PURCHASE_APPROVED' | 'PURCHASE_REFUNDED' | 'PURCHASE_CANCELED' | 'PURCHASE_COMPLETED' | 'SWITCH_PLAN_AUDIT'
    version: string
    data: {
        product: {
            id: number
            ucode: string
            name: string
            has_co_production: boolean
        }
        buyer: {
            email: string
            name: string
            checkout_phone?: string
        }
        purchase: {
            order_date: number
            transaction: string
            status: 'APPROVED' | 'BLOCKED' | 'CANCELLED' | 'CHARGEBACK' | 'COMPLETE' | 'EXPIRED' | 'NO_FUNDS' | 'OVERDUE' | 'PARTIALLY_REFUNDED' | 'PRE_ORDER' | 'PRINTED_BILLET' | 'PROCESSING_TRANSACTION' | 'PROTESTED' | 'REFUNDED' | 'STARTED' | 'UNDER_ANALISYS' | 'WAITING_PAYMENT'
            price: {
                value: number
                currency_code: string
            }
            original_price: {
                value: number
                currency_code: string
            }
            payment: {
                type: string
                method: string
                installments_number: number
            }
        }
    }
}
