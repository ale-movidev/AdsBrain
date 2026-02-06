export default function PrivacyPolicy() {
    return (
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Política de Privacidade – AdsOps Online</h1>

            <p className="mb-4 text-gray-600">
                O AdsOps Online respeita a privacidade dos seus usuários e está comprometido com a proteção dos dados coletados.
            </p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-2">1. Dados coletados</h2>
                    <p className="text-gray-600">
                        Coletamos dados de campanhas de anúncios e vendas fornecidos pelas plataformas integradas, como Meta Ads, Hotmart e Kiwify, incluindo métricas de desempenho, valores de vendas e status de transações.
                        <br className="my-2" />
                        O AdsOps Online não coleta senhas das plataformas integradas.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">2. Uso das informações</h2>
                    <ul className="list-disc pl-5 text-gray-600">
                        <li>Análise de desempenho de campanhas</li>
                        <li>Geração de relatórios e insights automatizados</li>
                        <li>Apoio à tomada de decisões de marketing</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">3. Compartilhamento de dados</h2>
                    <p className="text-gray-600">
                        Os dados não são compartilhados com terceiros, exceto quando exigido por lei.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">4. Armazenamento e segurança</h2>
                    <p className="text-gray-600">
                        Os dados são armazenados em ambiente seguro, com controles técnicos e organizacionais para proteção das informações.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">5. Exclusão de dados</h2>
                    <p className="text-gray-600">
                        O usuário pode solicitar a exclusão de seus dados a qualquer momento através da página: <a href="/data-deletion" className="text-blue-600 hover:underline">Solicitar Exclusão</a>
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">6. Contato</h2>
                    <p className="text-gray-600">
                        Em caso de dúvidas, entre em contato pelo e-mail: <a href="mailto:contato@adsops.online" className="text-blue-600 hover:underline">contato@adsops.online</a>
                    </p>
                </section>
            </div>
        </div>
    )
}
