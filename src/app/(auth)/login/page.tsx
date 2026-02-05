import Link from "next/link"
import { login, signup } from "./actions"

export default function LoginPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Login Form */}
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 bg-background">
                <div className="w-full max-w-[360px] space-y-8">
                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Ads Brain
                        </h1>
                        <p className="text-muted-foreground">
                            Entre na sua conta para acessar o dashboard.
                        </p>
                    </div>

                    <form className="space-y-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="nome@exemplo.com"
                                required
                                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                formAction={login}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                            >
                                Entrar
                            </button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Ou
                                    </span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                formAction={signup}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
                            >
                                Criar conta
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Ao continuar, você concorda com nossos{" "}
                        <Link href="#" className="underline underline-offset-4 hover:text-primary">
                            Termos de Serviço
                        </Link>{" "}
                        e{" "}
                        <Link href="#" className="underline underline-offset-4 hover:text-primary">
                            Política de Privacidade
                        </Link>
                        .
                    </p>
                </div>
            </div>

            {/* Right: Branding / Geometric Pattern */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-black/95 relative overflow-hidden">
                <div className="absolute inset-0 bg-geometric-pattern opacity-20"></div>
                <div className="relative z-10 max-w-lg text-center space-y-4 p-12">
                    <div className="inline-flex items-center gap-2 rounded-full border border-header-accent/40 bg-header-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-header-accent mb-6">
                        Beta Exclusivo
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">
                        Inteligência para o seu tráfego pago
                    </h2>
                    <p className="text-lg text-white/70">
                        Otimize campanhas do Meta Ads utilizando recomendações baseadas em dados reais de vendas da Hotmart e Kiwify.
                    </p>
                </div>
            </div>
        </div>
    )
}
