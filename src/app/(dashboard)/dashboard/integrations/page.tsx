import { getIntegrations, getUserOrgId } from "./actions"
import { IntegrationList } from "./integration-list"

export default async function IntegrationsPage() {
    const integrations = await getIntegrations()
    const orgId = await getUserOrgId()

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2 mt-4 mb-4">
                <h2 className="text-3xl font-bold tracking-tight">Integrações</h2>
            </div>

            {/* Warning if no org */}
            {!orgId && (
                <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-lg mb-4 text-sm">
                    ⚠️ Você precisa fazer parte de uma organização para conectar integrações.
                </div>
            )}

            <IntegrationList existingIntegrations={integrations || []} orgId={orgId} />
        </div>
    )
}
