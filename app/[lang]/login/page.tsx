"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const DEMO_DEFAULT_EMAIL = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL || "reviewer-demo@inversave.local";
const DEMO_DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD || "InversaveDemo123!";
const DEMO_LOGIN_TOAST_KEY = "inversave:demo-login-success";

function LoginContent() {
    const params = useParams<{ lang?: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();

    const [isCheckingProvider, setIsCheckingProvider] = useState(true);
    const [isGoogleReady, setIsGoogleReady] = useState(false);
    const [isDemoReady, setIsDemoReady] = useState(false);
    const [demoEmail, setDemoEmail] = useState("");
    const [demoPassword, setDemoPassword] = useState("");
    const [errorText, setErrorText] = useState<string | null>(null);

    const lang = typeof params?.lang === "string" ? params.lang : "en";
    const callbackFromQuery = searchParams.get("callbackUrl");
    const callbackUrl =
        callbackFromQuery && callbackFromQuery.startsWith("/")
            ? callbackFromQuery
            : `/${lang}/login-success`;
    const demoCallbackUrl =
        callbackFromQuery && callbackFromQuery.startsWith("/")
            ? callbackFromQuery
            : `/${lang}/profile`;

    useEffect(() => {
        let isMounted = true;

        const checkProvider = async () => {
            try {
                const res = await fetch("/api/auth/providers", { cache: "no-store" });
                if (!res.ok) {
                    if (isMounted) {
                        setIsGoogleReady(false);
                        setErrorText("Gagal memeriksa provider auth.");
                    }
                    return;
                }

                const providers = (await res.json()) as Record<string, unknown>;
                if (isMounted) {
                    const hasGoogle = Boolean(providers.google);
                    const hasDemoCredentials = Boolean(providers.credentials);

                    setIsGoogleReady(hasGoogle);
                    setIsDemoReady(hasDemoCredentials);

                    if (!hasGoogle && !hasDemoCredentials) {
                        setErrorText("Metode login belum aktif di server.");
                    } else {
                        setErrorText(null);
                    }
                }
            } catch {
                if (isMounted) {
                    setIsGoogleReady(false);
                    setIsDemoReady(false);
                    setErrorText("Gagal menghubungi auth provider.");
                }
            } finally {
                if (isMounted) setIsCheckingProvider(false);
            }
        };

        checkProvider();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            router.replace(callbackUrl);
        }
    }, [status, router, callbackUrl]);

    const handleGoogleLogin = async () => {
        setErrorText(null);

        if (!isGoogleReady) {
            setErrorText("Google provider belum aktif di server.");
            return;
        }

        const result = await signIn("google", {
            redirect: false,
            callbackUrl,
        });

        if (result?.error) {
            setErrorText(`Login Google gagal: ${result.error}`);
            return;
        }

        if (result?.url) {
            window.location.href = result.url;
            return;
        }

        setErrorText("URL login Google tidak tersedia.");
    };

    const handleDemoLogin = async () => {
        const inputEmail = demoEmail.trim().toLowerCase();
        const inputPassword = demoPassword;

        if (!inputEmail || !inputPassword) {
            setErrorText("Isi email dan password demo terlebih dahulu.");
            return;
        }

        await handleDemoLoginSubmit(inputEmail, inputPassword);
    };

    const handleDemoLoginSubmit = async (email: string, password: string) => {
        setErrorText(null);

        if (!isDemoReady) {
            setErrorText("Provider login demo belum aktif di server.");
            return;
        }

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setErrorText("Login demo gagal. Periksa email/password demo.");
                return;
            }

            sessionStorage.setItem(DEMO_LOGIN_TOAST_KEY, "1");

            // Force full page reload to profile so JWT session is picked up
            window.location.href = `/${lang}/profile`;
        } catch {
            setErrorText("Terjadi kesalahan saat login demo.");
        }
    };

    const handleQuickDemoLogin = async () => {
        setDemoEmail(DEMO_DEFAULT_EMAIL);
        setDemoPassword(DEMO_DEFAULT_PASSWORD);
        await handleDemoLoginSubmit(DEMO_DEFAULT_EMAIL, DEMO_DEFAULT_PASSWORD);
    };

    return (
        <div className="min-h-screen bg-[#f6f6ee] pt-28 pb-16">
            <div className="mx-auto max-w-md px-4">
                <div className="rounded-2xl border-[3px] border-black bg-white p-6 shadow-neo">
                    <h1 className="text-2xl font-black text-black">Login</h1>
                    <p className="mt-2 text-sm font-bold text-black/70">
                        Masuk pakai Google atau akun demo reviewer untuk akses member area.
                    </p>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isCheckingProvider || !isGoogleReady}
                        className="mt-6 w-full rounded-xl border-[3px] border-black bg-[#a0d1d6] px-4 py-3 text-sm font-black text-black shadow-neo-sm transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo disabled:cursor-not-allowed disabled:bg-gray-200"
                    >
                        {isCheckingProvider ? "Cek konfigurasi..." : "Lanjut Login Google"}
                    </button>

                    {isDemoReady && (
                        <div className="mt-5 rounded-xl border-[3px] border-black bg-[#f3f4ff] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-black">Login Demo Reviewer</p>
                            <button
                                type="button"
                                onClick={handleQuickDemoLogin}
                                className="mt-3 w-full rounded-lg border-[3px] border-black bg-[#ffeb3b] px-3 py-2 text-sm font-black text-black shadow-neo-sm transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo"
                            >
                                Masuk Akun Demo (1 Klik)
                            </button>
                            <p className="mt-3 text-[11px] font-bold text-black/70">
                                Atau isi email/password demo secara manual:
                            </p>
                            <div className="mt-3 space-y-3">
                                <input
                                    type="email"
                                    value={demoEmail}
                                    onChange={(e) => setDemoEmail(e.target.value)}
                                    placeholder="Email demo"
                                    className="w-full rounded-lg border-[3px] border-black bg-white px-3 py-2 text-sm font-bold text-black outline-none"
                                />
                                <input
                                    type="password"
                                    value={demoPassword}
                                    onChange={(e) => setDemoPassword(e.target.value)}
                                    placeholder="Password demo"
                                    className="w-full rounded-lg border-[3px] border-black bg-white px-3 py-2 text-sm font-bold text-black outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleDemoLogin}
                                    className="w-full rounded-lg border-[3px] border-black bg-[#d7fce0] px-3 py-2 text-sm font-black text-black shadow-neo-sm transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo"
                                >
                                    Login Demo
                                </button>
                            </div>
                        </div>
                    )}

                    {errorText && (
                        <div className="mt-4 rounded-xl border-[3px] border-red-600 bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                            {errorText}
                        </div>
                    )}

                    {!isCheckingProvider && !isGoogleReady && !isDemoReady && (
                        <div className="mt-4 rounded-xl border-[3px] border-black bg-[#fff6e8] px-3 py-3 text-xs font-black text-black">
                            <p>Isi env ini di .env.local lalu restart dev server:</p>
                            <p className="mt-2">AUTH_GOOGLE_ID</p>
                            <p>AUTH_GOOGLE_SECRET</p>
                            <p className="mt-2">Alternatif juga didukung:</p>
                            <p>GOOGLE_CLIENT_ID</p>
                            <p>GOOGLE_CLIENT_SECRET</p>
                            <p className="mt-2">Atau aktifkan login demo:</p>
                            <p>DEMO_LOGIN_ENABLED=true</p>
                            <p>DEMO_LOGIN_EMAIL=demo@domain.com</p>
                            <p>DEMO_LOGIN_PASSWORD=your-password</p>
                        </div>
                    )}

                    <Link
                        href={`/${lang}`}
                        className="mt-5 inline-block text-xs font-black uppercase tracking-wide text-black/70 underline"
                    >
                        Kembali ke beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
