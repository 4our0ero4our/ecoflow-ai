"use client";
import Image from "next/image";

const QIDDIYA_IMAGE = "/images/Qiddiya City Image.jpg";

export default function LoginPage() {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#e8f5e9]">
        {/* Decorative background shapes */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-[3rem] bg-emerald-200/60 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-[2.5rem] bg-emerald-100/70 blur-2xl"
          aria-hidden
        />
  
        <div className="relative flex min-h-screen items-center justify-center p-4 md:p-8">
          {/* Main card container */}
          <div className="flex w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl">
            {/* Left column — Login form */}
            <section className="flex w-full flex-1 flex-col justify-between p-8 md:p-10 lg:p-12">
              <header className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-1.5">
                  <span className="text-xl font-semibold text-zinc-800">
                    EcoFlow
                  </span>
                  <svg
                    className="h-5 w-5 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M12 2C8 2 5 5 5 9c0 4 3 7 7 11 4-4 7-7 7-11 0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                  </svg>
                  <span className="text-xl font-semibold text-emerald-600">
                    AI
                  </span>
                </a>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
                  aria-label="Select language"
                >
                  <span className="text-base" aria-hidden>
                    🇸🇦
                  </span>
                  <span>En</span>
                  <svg
                    className="h-4 w-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </header>
  
              <div className="flex flex-1 flex-col justify-center py-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-800 md:text-4xl">
                  Welcome!
                </h1>
                <p className="mt-2 max-w-sm text-zinc-500">
                  Sign in to the Operator Command Center. Enter your email and
                  password to access real-time venue analytics and controls.
                </p>
  
                <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Your email address"
                      autoComplete="email"
                      className="w-full rounded-2xl border-0 bg-zinc-100 px-4 py-3.5 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      className="w-full rounded-2xl border-0 bg-zinc-100 px-4 py-3.5 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="flex justify-end">
                    <a
                      href="#forgot"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-zinc-900 px-4 py-3.5 font-medium text-white transition-colors hover:bg-zinc-800"
                  >
                    Next step
                  </button>
                  <p className="mt-4 text-center text-sm text-zinc-500">
                    Don&apos;t have an account?{" "}
                    <a
                      href="/signup"
                      className="font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Sign up
                    </a>
                  </p>
                </form>
              </div>
  
              <footer className="space-y-1 pt-4">
                <p className="text-sm text-zinc-500">
                  Need help?{" "}
                  <a
                    href="mailto:support@ecoflow.ai"
                    className="font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    support@ecoflow.ai
                  </a>
                </p>
                <p className="text-xs text-zinc-400">
                  © {new Date().getFullYear()} EcoFlow AI. All rights reserved.
                </p>
              </footer>
            </section>
  
            {/* Right column — Image with overlay */}
            <section className="relative hidden w-full flex-1 lg:block">
              <div className="relative h-full min-h-[420px] w-full">
                <Image
                  src={QIDDIYA_IMAGE}
                  alt="Qiddiya City — entertainment and leisure destination"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0px, 50vw"
                  priority
                />
                {/* Overlay card */}
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/90 p-6 shadow-lg backdrop-blur-sm md:left-8 md:right-8 md:bottom-8">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-emerald-500/60 text-emerald-600"
                      aria-hidden
                    >
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                      Live
                    </span>
                  </div>
                  <h2 className="text-lg font-bold leading-snug text-zinc-800 md:text-xl">
                    Real-time digital twin for smarter operations
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Monitor congestion, sustainability metrics, and alerts across
                    your venue. Powered by event-driven data and AI predictions.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }