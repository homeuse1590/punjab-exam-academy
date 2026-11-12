
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Supabase configuration is missing.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <main className="account-page">
      <div className="account-container">
        <div className="account-heading">
          <span className="account-label">STUDENT PORTAL</span>
          <h1>Student Login</h1>
          <p>ਵਿਦਿਆਰਥੀ ਲਾਗਇਨ</p>
        </div>

        <div className="account-card login-card">
          <div className="account-icon">PE</div>

          <h2>Welcome Back!</h2>
          <p>Sign in to continue your exam preparation.</p>

          <form onSubmit={login} style={{ marginTop: 25 }}>
            <label style={{ display: "block", textAlign: "left", marginBottom: 8 }}>
              Email Address
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                width: "100%",
                padding: 14,
                marginBottom: 18,
                border: "1px solid #d8e1ef",
                borderRadius: 10,
              }}
            />

            <label style={{ display: "block", textAlign: "left", marginBottom: 8 }}>
              Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: 14,
                marginBottom: 18,
                border: "1px solid #d8e1ef",
                borderRadius: 10,
              }}
            />

            <button
              type="submit"
              className="account-primary-btn"
              disabled={busy}
              style={{ width: "100%", border: 0, cursor: "pointer" }}
            >
              {busy ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          {message && (
            <p style={{ color: "#dc2626", marginTop: 18 }}>
              {message}
            </p>
          )}

          <p className="account-small">
            Don't have an account?
          </p>

          <Link className="account-secondary-btn" href="/signup">
            Create Account
          </Link>

          <p style={{ marginTop: 25 }}>
            <Link href="/">← Back to Home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
