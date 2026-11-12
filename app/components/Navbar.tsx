
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function checkUser() {
      const { data } = await supabase!.auth.getSession();

      if (active) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (!supabase) return;

    setBusy(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
    } else {
      setUser(null);
      window.location.href = "/";
    }

    setBusy(false);
  }

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <header>
      <div className="wrap nav">
        <Link className="brand" href="/">
          <span className="logo">PE</span>
          <span>Punjab Exam Academy</span>
        </Link>

        <nav className="links">
          <Link href="/quiz">MCQ Quiz</Link>
          <Link href="/mock-tests">Mock Tests</Link>
          <Link href="/notes">Study Notes</Link>
          <Link href="/papers">Previous Papers</Link>
          <Link href="/notifications">Notifications</Link>

          {!loading &&
            (user ? (
              <Link href="/account">
                {displayName}
              </Link>
            ) : (
              <Link href="/account">Student Login</Link>
            ))}
        </nav>

        {user ? (
          <button
            className="btn"
            onClick={logout}
            disabled={busy}
          >
            {busy ? "Signing out..." : "Logout"}
          </button>
        ) : (
          <Link className="btn" href="/quiz">
            Start Practice →
          </Link>
        )}
      </div>
    </header>
  );
}
