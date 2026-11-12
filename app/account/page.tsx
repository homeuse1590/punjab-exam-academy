
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Attempt = {
  id: string;
  test_name: string | null;
  score: number;
  total: number;
  created_at: string;
};

export default function Account() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadDashboard() {
      const { data } = await supabase!.auth.getSession();
      const session = data.session;

      if (!session) {
        if (active) {
          setUser(null);
          setAttempts([]);
          setLoading(false);
        }
        return;
      }

      if (active) setUser(session.user);

      const { data: history, error } = await supabase!
        .from("attempts")
        .select("id,test_name,score,total,created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (active) {
        setAttempts(error ? [] : (history as Attempt[]) || []);
        setLoading(false);
      }
    }

    loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadDashboard();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
    setAttempts([]);
    router.push("/");
    router.refresh();
  }

  const totalAttempts = attempts.length;

  const average =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce(
            (sum, item) =>
              sum +
              (item.total > 0
                ? (item.score / item.total) * 100
                : 0),
            0
          ) / totalAttempts
        )
      : 0;

  const bestScore =
    totalAttempts > 0
      ? Math.max(
          ...attempts.map((item) =>
            item.total > 0
              ? Math.round((item.score / item.total) * 100)
              : 0
          )
        )
      : 0;

  const name =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Student";

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-container">
          <div className="account-card">
            <p>Loading student dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="account-page">
        <div className="account-container">
          <div className="account-heading">
            <span className="account-label">STUDENT PORTAL</span>
            <h1>Student Dashboard</h1>
            <p>ਵਿਦਿਆਰਥੀ ਡੈਸ਼ਬੋਰਡ</p>
          </div>

          <div className="account-card login-card">
            <div className="account-icon">PE</div>
            <h2>Welcome to Punjab Exam Academy</h2>
            <p>
              Please sign in to access your dashboard,
              performance and quiz history.
            </p>

            <Link className="account-primary-btn" href="/login">
              Sign in →
            </Link>

            <p className="account-small">
              New student? Create your account to start learning.
            </p>

            <Link className="account-secondary-btn" href="/signup">
              Create Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="account-container">
        <div className="account-top">
          <Link href="/" className="account-back">
            ← Back to Home
          </Link>

          <button className="account-logout" onClick={logout}>
            Sign Out
          </button>
        </div>

        <div className="account-heading">
          <span className="account-label">STUDENT PORTAL</span>
          <h1>Student Dashboard</h1>
          <p>ਵਿਦਿਆਰਥੀ ਡੈਸ਼ਬੋਰਡ</p>
        </div>

        <section className="account-welcome">
          <div>
            <span className="account-label">YOUR ACCOUNT</span>
            <h2>Welcome, {name}!</h2>
            <p>{user.email}</p>
            <span className="account-status">
              ✓ Successfully signed in
            </span>
          </div>

          <div className="account-icon-large">PE</div>
        </section>

        <section className="account-section">
          <div className="account-section-heading">
            <h2>Your Performance</h2>
            <p>Your learning progress at a glance.</p>
          </div>

          <div className="account-stats">
            <div className="account-stat">
              <span className="account-stat-icon">📝</span>
              <p>Total Attempts</p>
              <h3>{totalAttempts}</h3>
            </div>

            <div className="account-stat">
              <span className="account-stat-icon">📊</span>
              <p>Average Score</p>
              <h3>{average}%</h3>
            </div>

            <div className="account-stat">
              <span className="account-stat-icon">🏆</span>
              <p>Best Score</p>
              <h3>{bestScore}%</h3>
            </div>
          </div>
        </section>

        <section className="account-section">
          <div className="account-section-heading">
            <h2>Continue Learning</h2>
            <p>Choose your next preparation activity.</p>
          </div>

          <div className="account-learning-grid">
            <Link href="/quiz" className="account-learning-card">
              <span>📝</span>
              <h3>MCQ Practice</h3>
              <p>Practice objective questions.</p>
              <strong>Start Practice →</strong>
            </Link>

            <Link href="/mock-tests" className="account-learning-card">
              <span>🎯</span>
              <h3>Mock Tests</h3>
              <p>Prepare with examination simulations.</p>
              <strong>Take a Test →</strong>
            </Link>

            <Link href="/notes" className="account-learning-card">
              <span>📚</span>
              <h3>Study Notes</h3>
              <p>Access your study materials.</p>
              <strong>Explore Notes →</strong>
            </Link>

            <Link href="/papers" className="account-learning-card">
              <span>📄</span>
              <h3>Previous Papers</h3>
              <p>Explore previous examination papers.</p>
              <strong>View Papers →</strong>
            </Link>
          </div>
        </section>

        <section className="account-section">
          <div className="account-section-heading">
            <h2>Recent Quiz Attempts</h2>
            <p>Your latest practice results.</p>
          </div>

          {attempts.length === 0 ? (
            <div className="account-card account-empty">
              <h3>No attempts recorded yet.</h3>
              <p>Start practicing to track your performance.</p>
              <Link className="account-primary-btn" href="/quiz">
                Start Your First Quiz →
              </Link>
            </div>
          ) : (
            <div className="account-table-wrapper">
              <table className="account-table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {attempts.map((item) => (
                    <tr key={item.id}>
                      <td>{item.test_name || "MCQ Practice"}</td>
                      <td>
                        {item.score}/{item.total}
                      </td>
                      <td>
                        {item.total > 0
                          ? Math.round(
                              (item.score / item.total) * 100
                            )
                          : 0}
                        %
                      </td>
                      <td>
                        {new Date(item.created_at).toLocaleDateString(
                          "en-IN"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="account-footer">
          Punjab Exam Academy · Your preparation, your progress.
        </footer>
      </div>
    </main>
  );
}
