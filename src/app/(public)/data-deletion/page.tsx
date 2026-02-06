export default function DataDeletion() {
    return (
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Exclusão de Dados – AdsOps Online</h1>

            <p className="mb-4 text-gray-600">
                O AdsOps Online respeita os direitos de privacidade dos usuários.
            </p>

            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <p className="mb-4">
                    Para solicitar a exclusão dos seus dados pessoais e dados de integração, envie um e-mail para:
                </p>

                <a href="mailto:contato@adsops.online" className="text-xl font-medium text-blue-600 hover:underline block mb-6">
                    contato@adsops.online
                </a>

                <div className="space-y-2 text-sm text-gray-600">
                    <p className="font-semibold">Informe no e-mail:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Nome completo</li>
                        <li>E-mail cadastrado na plataforma</li>
                        <li>Nome da organização</li>
                    </ul>
                </div>
            </div>

            <p className="mt-6 text-sm text-gray-500">
                A solicitação será processada em até 7 dias úteis.
            </p>
        </div>
    )
}
