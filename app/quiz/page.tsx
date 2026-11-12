
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Question = {
  id: string;
  subject: string;
  exam: string | null;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  language: string;
  difficulty: string;
};

export default function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subject, setSubject] = useState("All");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Load published questions
  useEffect(() => {
    let active = true;

    async function loadQuestions() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        setError(error.message);
      } else {
        const valid = (data || []).filter(
          (q) =>
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            Number.isInteger(q.answer) &&
            q.answer >= 0 &&
            q.answer < q.options.length
        );

        setQuestions(valid as Question[]);
      }

      setLoading(false);
    }

    loadQuestions();

    return () => {
      active = false;
    };
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(questions.map((q) => q.subject))).sort(),
    [questions]
  );

  const filtered =
    subject === "All"
      ? questions
      : questions.filter((q) => q.subject === subject);

  const q = filtered[index];

  const answeredCount = Object.keys(answers).length;

  const score = filtered.reduce(
    (total, question, i) =>
      total + (answers[i] === question.answer ? 1 : 0),
    0
  );

  const percentage = filtered.length
    ? Math.round((score / filtered.length) * 100)
    : 0;

  // Reset quiz
  function reset() {
    setIndex(0);
    setAnswers({});
    setSubmitted(false);
    setSavingAttempt(false);
    setSaveMessage("");
  }

  // Change subject
  function changeSubject(value: string) {
    setSubject(value);
    reset();
  }

  // Submit quiz and save attempt in Supabase
  async function submitQuiz() {
    if (savingAttempt || submitted || filtered.length === 0) return;

    setSavingAttempt(true);
    setSaveMessage("");

    try {
      if (!supabase) {
        setSaveMessage("Quiz completed. Supabase is not configured.");
        setSubmitted(true);
        return;
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      const user = userData.user;

      // Save only if student is logged in
      if (user) {
        const { error: insertError } = await supabase
          .from("attempts")
          .insert({
            user_id: user.id,
            test_name: `MCQ Practice - ${subject}`,
            score: score,
            total: filtered.length,
            answers: answers,
          });

        if (insertError) throw insertError;

        setSaveMessage("Attempt saved successfully.");
      } else {
        setSaveMessage(
          "Quiz completed. Login to save your attempts."
        );
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Attempt saving failed:", err);

      setSaveMessage(
        "Quiz completed, but attempt could not be saved. Please check your login or try again later."
      );

      setSubmitted(true);
    } finally {
      setSavingAttempt(false);
    }
  }

  return (
    <main
      className="wrap"
      style={{ padding: "32px 22px 60px", maxWidth: 1000 }}
    >
      <Link href="/">← Home</Link>

      <header style={{ margin: "24px 0" }}>
        <p style={{ color: "#64748b", fontWeight: 700 }}>
          PUNJAB EXAM ACADEMY · PRACTICE
        </p>

        <h1>MCQ Practice / ਬਹੁ-ਵਿਕਲਪੀ ਪ੍ਰਸ਼ਨ</h1>

        <p>Practice published questions and review your answers.</p>
      </header>

      {loading && (
        <div className="card">Loading published questions...</div>
      )}

      {error && (
        <div className="card">
          <h3>Unable to load questions</h3>
          <p>{error}</p>

          <button
            className="btn"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div
            className="card"
            style={{ padding: 18, marginBottom: 20 }}
          >
            <label>
              <strong>Subject </strong>

              <select
                value={subject}
                onChange={(e) => changeSubject(e.target.value)}
              >
                <option value="All">All Subjects</option>

                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <p>{filtered.length} published questions</p>
          </div>

          {filtered.length === 0 ? (
            <div className="card">
              <h2>No published MCQs yet</h2>
              <p>
                Questions published by the administrator will appear here.
              </p>
            </div>
          ) : submitted ? (
            <section className="card" style={{ padding: 24 }}>
              <div style={{ textAlign: "center" }}>
                <p>QUIZ COMPLETED</p>

                <h2 style={{ fontSize: 34 }}>
                  {score}/{filtered.length}
                </h2>

                <h3>{percentage}% Score</h3>

                <p>{answeredCount} questions attempted</p>

                {saveMessage && (
                  <p
                    style={{
                      fontWeight: 600,
                      color: saveMessage.includes("successfully")
                        ? "#15803d"
                        : "#2563eb",
                    }}
                  >
                    {saveMessage}
                  </p>
                )}

                <button className="btn" onClick={reset}>
                  Practice Again
                </button>
              </div>

              {filtered.map((item, i) => {
                const chosen = answers[i];
                const correct = chosen === item.answer;

                return (
                  <article
                    key={item.id}
                    style={{
                      borderTop: "1px solid #e2e8f0",
                      padding: "18px 0",
                    }}
                  >
                    <strong>
                      {i + 1}. {item.question}
                    </strong>

                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      {item.options.map((option, j) => {
                        const isCorrect = j === item.answer;
                        const isChosen = j === chosen;

                        return (
                          <div
                            key={j}
                            style={{
                              padding: 12,
                              borderRadius: 10,
                              border: `1px solid ${
                                isCorrect
                                  ? "#86efac"
                                  : isChosen
                                  ? "#fca5a5"
                                  : "#e2e8f0"
                              }`,
                              background: isCorrect
                                ? "#f0fdf4"
                                : isChosen
                                ? "#fef2f2"
                                : "#fff",
                            }}
                          >
                            <strong>
                              {String.fromCharCode(65 + j)}.
                            </strong>{" "}
                            {option}

                            {isCorrect && (
                              <span style={{ color: "#15803d" }}>
                                {" "}✓ Correct
                              </span>
                            )}

                            {isChosen && !isCorrect && (
                              <span style={{ color: "#b91c1c" }}>
                                {" "}✗ Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p
                      style={{
                        color: correct ? "#15803d" : "#b91c1c",
                        fontWeight: 600,
                      }}
                    >
                      {chosen === undefined
                        ? "Not attempted"
                        : correct
                        ? "Correct answer"
                        : "Incorrect answer"}
                    </p>

                    {item.explanation && (
                      <div
                        style={{
                          padding: 12,
                          background: "#f8fafc",
                          borderRadius: 10,
                        }}
                      >
                        <strong>Explanation: </strong>
                        {item.explanation}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          ) : q ? (
            <section className="card" style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <strong>
                  QUESTION {index + 1} OF {filtered.length}
                </strong>

                <span className="pill">{q.subject}</span>
              </div>

              <div
                style={{
                  height: 8,
                  background: "#e2e8f0",
                  borderRadius: 99,
                  margin: "18px 0",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${((index + 1) / filtered.length) * 100}%`,
                    background: "#2563eb",
                    borderRadius: 99,
                  }}
                />
              </div>

              <h2 style={{ lineHeight: 1.5 }}>{q.question}</h2>

              <div style={{ display: "grid", gap: 12 }}>
                {q.options.map((option, i) => {
                  const selected = answers[index] === i;

                  return (
                    <button
                      type="button"
                      key={i}
                      aria-pressed={selected}
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [index]: i }))
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        width: "100%",
                        textAlign: "left",
                        padding: 15,
                        borderRadius: 12,
                        border: `2px solid ${
                          selected ? "#2563eb" : "#e2e8f0"
                        }`,
                        background: selected ? "#eff6ff" : "#fff",
                        color: "#0f172a",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 8,
                          fontWeight: 800,
                          background: selected ? "#2563eb" : "#f1f5f9",
                          color: selected ? "#fff" : "#475569",
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>

                      {option}

                      {selected && (
                        <span style={{ marginLeft: "auto" }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 24,
                }}
              >
                <button
                  className="btn secondary"
                  disabled={index === 0 || savingAttempt}
                  onClick={() => setIndex((i) => i - 1)}
                >
                  ← Previous
                </button>

                <span>
                  {answeredCount}/{filtered.length} answered
                </span>

                {index < filtered.length - 1 ? (
                  <button
                    className="btn"
                    disabled={savingAttempt}
                    onClick={() => setIndex((i) => i + 1)}
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    className="btn"
                    onClick={submitQuiz}
                    disabled={savingAttempt}
                  >
                    {savingAttempt ? "Saving..." : "Submit Quiz"}
                  </button>
                )}
              </div>

              {index === filtered.length - 1 &&
                answeredCount < filtered.length && (
                  <p style={{ color: "#b45309", marginTop: 12 }}>
                    Some questions are unanswered. You can still submit.
                  </p>
                )}
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
