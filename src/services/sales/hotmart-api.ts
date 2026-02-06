import { HotmartWebhookBody } from "./types"

const HOTMART_AUTH_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token'
const HOTMART_API_URL = 'https://developers.hotmart.com/payments/api/v1'

interface HotmartTokenResponse {
    access_token: string
    token_type: string
    expires_in: number
    scope: string
}

interface HotmartSale {
    transaction: string
    status: string
    purchase: {
        order_date: number // milliseconds
        price: {
            value: number
            currency_code: string
        }
        payment: {
            method: string
        }
    }
    product: {
        id: number
        name: string
    }
    buyer: {
        email: string
        name: string
    }
}

interface HotmartHistoryResponse {
    items: HotmartSale[]
    page_info: {
        total_results: number
        next_page_token?: string
    }
}

export class HotmartApiClient {
    private clientId: string
    private clientSecret: string
    private basicToken?: string

    constructor(clientId: string, clientSecret: string, basicToken?: string) {
        this.clientId = clientId.trim()
        this.clientSecret = clientSecret.trim()
        this.basicToken = basicToken?.trim()
    }

    private getBasicAuthHeader(): string {
        if (this.basicToken) {
            const token = this.basicToken.startsWith('Basic ')
                ? this.basicToken.split('Basic ')[1]
                : this.basicToken
            return `Basic ${token}`
        }
        return `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
    }

    async getAccessToken(): Promise<string> {
        // params removed as they were unused

        const res = await fetch(`${HOTMART_AUTH_URL}?grant_type=client_credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.getBasicAuthHeader()
            }
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Failed to authenticate with Hotmart: ${res.status} ${err}`)
        }

        const data = await res.json() as HotmartTokenResponse
        return data.access_token
    }

    async getSalesHistory(startDate: number, endDate: number): Promise<HotmartSale[]> {
        const token = await this.getAccessToken()

        let allSales: HotmartSale[] = []
        let nextPageToken: string | undefined = undefined

        do {
            const url = new URL(`${HOTMART_API_URL}/sales/history`)
            url.searchParams.append('start_date', startDate.toString())
            url.searchParams.append('end_date', endDate.toString())
            // Request all statuses to capture refunds and chargebacks
            url.searchParams.append('transaction_status', 'APPROVED,COMPLETE,REFUNDED,CHARGEBACK,CANCELLED,EXPIRED')
            if (nextPageToken) {
                url.searchParams.append('page_token', nextPageToken)
            }

            const res = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!res.ok) {
                const err = await res.text()
                console.error('Hotmart API Error:', err)
                throw new Error(`Failed to fetch sales history: ${res.status}`)
            }

            const data = await res.json() as HotmartHistoryResponse
            console.log(`[HotmartAPI] Fetch URL: ${url.toString()}`)
            console.log(`[HotmartAPI] Response items count: ${data.items ? data.items.length : 0}`)
            if (data.items && data.items.length > 0) {
                console.log(`[HotmartAPI] First item sample:`, JSON.stringify(data.items[0], null, 2))
            }

            if (data.items) {
                allSales = allSales.concat(data.items)
            }
            nextPageToken = data.page_info?.next_page_token

        } while (nextPageToken)

        return allSales
    }
}
