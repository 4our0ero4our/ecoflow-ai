"use client";

import Link from "next/link";
import { SetupForm } from "../dashboard/components/SetupForm";

export default function OrganizationPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#e8f5e9]">
            {/* Decorative background */}
            <div
                className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-[3rem] bg-emerald-200/60 blur-2xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-[2.5rem] bg-emerald-100/70 blur-2xl"
                aria-hidden
            />

            <div className="relative flex min-h-screen flex-col">
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between border-b border-slate-200/50 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-xl font-semibold text-slate-800 hover:text-emerald-600"
                    >
                        <span>EcoFlow</span>
                        <span className="text-emerald-600">AI</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 hidden sm:block">
                            Setup Organization
                        </span>
                    </div>
                </header>

                {/* Form — scrollable */}
                <main className="flex-1 overflow-y-auto py-6 sm:py-8">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6">
                        <SetupForm />
                    </div>
                </main>
            </div>
        </div>
    );
}
