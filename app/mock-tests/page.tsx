
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type MockTest = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  duration_minutes: number;
  negative_marking: number;
};

export default function MockTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTests() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("mock_tests")
        .select("id,title,description,subject,duration_minutes,negative_marking")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const list = (data || []) as MockTest[];
      setTests(list);

      if (list.length > 0) {
        const { data: mappings, error: mappingError } = await supabase
          .from("mock_test_questions")
          .select("mock_test_id")
          .in("mock_test_id", list.map((x) => x.id));

        if (mappingError) {
          setError(mappingError.message);
        } else {
          const result: Record<string, number> = {};
          (mappings || []).forEach((x: any) => {
            result[x.mock_test_id] = (result[x.mock_test_id] || 0) + 1;
          });
          setCounts(result);
        }
      }

      setLoading(false);
    }

    loadTests();
  }, []);

  return (
    <main className="wrap" style={{ padding: "35px 22px 70px" }}>
      <Link href="/">← Home</Link>

      <h1 style={{ marginTop: 24 }}>Punjab Competitive Mock Tests</h1>
      <p className="meta">
        Punjab Exam Academy · Practice with timed examinations
      </p>

      {loading && <p>Loading published mock tests...</p>}

      {error && (
        <div className="card" style={{ color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {!loading && !error && tests.length === 0 && (
        <div className="card">
          <h2>No mock tests available yet</h2>
          <p>New tests will appear here after the administrator publishes them.</p>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
        gap: 20,
        marginTop: 25
      }}>
        {tests.map((test) => (
          <article className="card" key={test.id}>
            <h2>{test.title}</h2>

            <p>{test.description || "Practice test for Punjab competitive exams."}</p>

            <p><strong>Subject:</strong> {test.subject}</p>
            <p><strong>Questions:</strong> {counts[test.id] || 0}</p>
            <p><strong>Duration:</strong> {test.duration_minutes} minutes</p>
            <p><strong>Negative marking:</strong> -{Number(test.negative_marking)}</p>

            {(counts[test.id] || 0) === 0 ? (
              <button className="btn" disabled>
                Questions not assigned
              </button>
            ) : (
              <Link className="btn" href={`/mock-tests/${test.id}`}>
                Start Test →
              </Link>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
