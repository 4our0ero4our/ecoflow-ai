"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

const USER_DB_KEY = "ecoflow_user_db";
const SESSION_KEY = "ecoflow_session";

const QIDDIYA_IMAGE = "/images/Qiddiya City Image.jpg";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Save to LocalStorage (Pseudo-Register)
      // Check if user exists? For now just overwrite or append if we were building a list.
      // We'll treat this as a single-user local demo for simplicity, or simple db.
      const usersRaw = localStorage.getItem(USER_DB_KEY);
      const users = usersRaw ? JSON.parse(usersRaw) : [];

      // Simple check
      if (users.find((u: any) => u.email === formData.email)) {
        throw new Error("User with this email already exists locally.");
      }

      const newUser = { ...formData, id: Date.now() };
      users.push(newUser);

      localStorage.setItem(USER_DB_KEY, JSON.stringify(users));

      // 2. Auto Login (Set Session)
      // We store the sensitive info in local storage session just for this demo
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

      // 3. Redirect to Organization Setup
      router.push("/organization");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
      setLoading(false);
    }
  };

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
          {/* Left column — Signup form */}
          <section className="flex w-full flex-1 flex-col justify-between p-8 md:p-10 lg:p-12">
            <header className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-1.5">
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
              </Link>
            </header>

            <div className="flex flex-1 flex-col justify-center py-8">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-800 md:text-4xl">
                Create Account
              </h1>
              <p className="mt-2 max-w-sm text-zinc-500">
                Join the EcoFlow network. Monitor analytics and manage venue sustainability in real-time.
              </p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="sr-only">First Name</label>
                    <input
                      id="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="w-full rounded-2xl border-0 bg-zinc-100 px-4 py-3.5 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="sr-only">Last Name</label>
                    <input
                      id="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="w-full rounded-2xl border-0 bg-zinc-100 px-4 py-3.5 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    autoComplete="email"
                    className="w-full rounded-2xl border-0 bg-zinc-100 px-4 py-3.5 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border-0 bg-zinc-100 px-4 py-3.5 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl bg-zinc-900 px-4 py-3.5 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>

                <p className="mt-4 text-center text-sm text-zinc-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
                    Log in
                  </Link>
                </p>
              </form>
            </div>

            <footer className="space-y-1 pt-4">
              <p className="text-sm text-zinc-500">
                Need help? <a href="mailto:support@ecoflow.ai" className="font-medium text-emerald-600 hover:text-emerald-700">support@ecoflow.ai</a>
              </p>
              <p className="text-xs text-zinc-400">
                © {new Date().getFullYear()} EcoFlow AI. All rights reserved.
              </p>
            </footer>
          </section>

          {/* Right column — Image */}
          <section className="relative hidden w-full flex-1 lg:block">
            <div className="relative h-full min-h-[420px] w-full">
              <Image
                src={QIDDIYA_IMAGE}
                alt="Qiddiya City"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0px, 50vw"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-8 text-white">
                <h2 className="text-xl font-bold">Join the revolution</h2>
                <p className="mt-2 text-sm opacity-90">Be part of the future of sustainable event management.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
