
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function Notifications() {
  let rows: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    rows = data || [];
  }

  return (
    <main className="wrap" style={{ padding: "35px 22px 60px" }}>
      <Link href="/">← Home</Link>

      <h1>Exam Notifications</h1>

      <p>
        Always verify deadlines and eligibility against the official recruitment notice.
      </p>

      {rows.map((r) => (
        <article className="card" key={r.id} style={{ marginBottom: 12 }}>
          <h3>{r.title}</h3>
          <p>{r.body}</p>

          {r.url && (
            <a className="btn" href={r.url} target="_blank" rel="noopener noreferrer">
              Official notice ↗
            </a>
          )}
        </article>
      ))}

      <article className="card">
        <h3>Official recruitment websites</h3>
        <p>Use official sources for final application and eligibility details.</p>

        <p>
          <a href="https://sssb.punjab.gov.in/" target="_blank" rel="noopener noreferrer">
            Punjab Subordinate Services Selection Board ↗
          </a>
        </p>

        <p>
          <a href="https://punjab.gov.in/" target="_blank" rel="noopener noreferrer">
            Punjab Government ↗
          </a>
        </p>
      </article>
    </main>
  );
}
