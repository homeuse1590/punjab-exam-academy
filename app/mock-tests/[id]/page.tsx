
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Question = {
  id: string;
  subject: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type Test = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  negative_marking: number;
};

export default function IndividualMockTest() {
  const params = useParams();
  const router = useRouter();
  const testId = String(params.id);

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correct: number;
    wrong: number;
    skipped: number;
    total: number;
  } | null>(null);

  const submittedRef = useRef(false);

  useEffect(() => {
    async function loadTest() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      const { data: testData, error: testError } = await supabase
        .from("mock_tests")
        .select("id,title,description,duration_minutes,negative_marking")
        .eq("id", testId)
        .eq("published", true)
        .maybeSingle();

      if (testError || !testData) {
        setError(testError?.message || "Mock test not found or unpublished.");
        setLoading(false);
        return;
      }

      setTest(testData as Test);

      const { data: mappings, error: mappingError } = await supabase
        .from("mock_test_questions")
        .select("question_id,question_order")
        .eq("mock_test_id", testId)
        .order("question_order", { ascending: true });

      if (mappingError) {
        setError(mappingError.message);
        setLoading(false);
        return;
      }

      const ids = (mappings || []).map((x: any) => x.question_id);

      if (ids.length === 0) {
        setError("This mock test has no questions.");
        setLoading(false);
        return;
      }

      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .select("id,subject,question,options,answer,explanation")
        .in("id", ids)
        .eq("published", true);

      if (questionError) {
        setError(questionError.message);
        setLoading(false);
        return;
      }

      const questionMap = new Map(
        (questionData || []).map((q: any) => [q.id, q])
      );

      const ordered = ids
        .map((id: string) => questionMap.get(id))
        .filter(Boolean) as Question[];

      setQuestions(ordered);
      setSeconds(testData.duration_minutes * 60);
      setLoading(false);
    }

    loadTest();
  }, [testId]);

  const submitTest = useCallback(async (automatic = false) => {
    if (submittedRef.current || !test || questions.length === 0) return;

    submittedRef.current = true;
    setSubmitted(true);
    setStarted(false);

    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];

      if (selected === undefined) {
        skipped++;
      } else if (selected === Number(q.answer)) {
        correct++;
      } else {
        wrong++;
      }
    });

    const score = Number(
      (correct - wrong * Number(test.negative_marking)).toFixed(2)
    );

    const finalResult = {
      score,
      correct,
      wrong,
      skipped,
      total: questions.length,
    };

    setResult(finalResult);

    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();

      if (userData.user) {
        const { error: saveError } = await supabase.from("attempts").insert({
          user_id: userData.user.id,
          test_name: test.title,
          score,
          total: questions.length,
          answers,
        });

        if (saveError) {
          setError("Result calculated but saving failed: " + saveError.message);
        }
      }
    }

    if (automatic) {
      setError("Time ended. Your test was submitted automatically.");
    }
  }, [test, questions, answers]);

  useEffect(() => {
    if (!started || submitted) return;

    const timer = window.setInterval(() => {
      setSeconds((old) => {
        if (old <= 1) {
          window.clearInterval(timer);
          submitTest(true);
          return 0;
        }
        return old - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, submitted, submitTest]);

  const formatTime = (value: number) => {
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return <main className="wrap"><p>Loading mock test...</p></main>;
  }

  if (error && !test) {
    return (
      <main className="wrap" style={{ padding: 30 }}>
        <h1>Mock Test</h1>
        <p style={{ color: "crimson" }}>{error}</p>
        <Link href="/mock-tests">← Back to Mock Tests</Link>
      </main>
    );
  }

  if (!test) return null;

  if (submitted && result) {
    return (
      <main className="wrap" style={{ padding: "35px 22px 70px" }}>
        <Link href="/mock-tests">← Mock Tests</Link>
        <div className="card" style={{ marginTop: 25 }}>
          <h1>Test Result</h1>
          <h2>{test.title}</h2>

          <h1 style={{ color: "#2457a7", fontSize: 42 }}>
            {result.score} / {result.total}
          </h1>

          <p>Correct: {result.correct}</p>
          <p>Wrong: {result.wrong}</p>
          <p>Unattempted: {result.skipped}</p>
          <p>Negative marking: -{test.negative_marking} per wrong answer</p>

          {error && <p>{error}</p>}

          <Link className="btn" href="/account">
            View Student Dashboard
          </Link>
          <Link className="btn secondary" href="/mock-tests">
            Back to Mock Tests
          </Link>
        </div>

        <h2>Answer Review</h2>

        {questions.map((q, i) => {
          const selected = answers[q.id];
          const correctAnswer = Number(q.answer);

          return (
            <article className="card" key={q.id}>
              <h3>Question {i + 1}</h3>
              <p>{q.question}</p>

              <p>
                Your answer:{" "}
                {selected === undefined
                  ? "Not answered"
                  : q.options[selected]}
              </p>

              <p style={{ color: "green" }}>
                Correct answer: {q.options[correctAnswer]}
              </p>

              <p>{q.explanation || "No explanation provided."}</p>
            </article>
          );
        })}
      </main>
    );
  }

  const q = questions[current];
  const answered = Object.keys(answers).length;

  return (
    <main className="wrap" style={{ padding: "35px 22px 70px" }}>
      <Link href="/mock-tests">← Mock Tests</Link>

      <h1 style={{ marginTop: 24 }}>{test.title}</h1>
      <p className="meta">Punjab Exam Academy · Timed Examination</p>

      {!started ? (
        <section className="card" style={{ marginTop: 25 }}>
          <h2>Test Instructions</h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            gap: 15,
          }}>
            <div className="card"><h2>{questions.length}</h2><p>Questions</p></div>
            <div className="card"><h2>{test.duration_minutes} min</h2><p>Duration</p></div>
            <div className="card"><h2>1 mark</h2><p>Per correct answer</p></div>
          </div>

          <ul>
            <li>Each question has one correct answer.</li>
            <li>Choose one option for every question.</li>
            <li>You can navigate between questions.</li>
            <li>You can change answers before submitting.</li>
            <li>Unanswered questions receive zero marks.</li>
            <li>Wrong answers deduct {test.negative_marking} marks.</li>
            <li>The test submits automatically when the timer ends.</li>
            <li>Your result is saved to your dashboard when signed in.</li>
          </ul>

          <button className="btn" onClick={() => setStarted(true)}>
            Start Mock Test →
          </button>
        </section>
      ) : (
        <section className="card" style={{ marginTop: 25 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 15,
            flexWrap: "wrap",
          }}>
            <strong>Question {current + 1} / {questions.length}</strong>
            <strong style={{
              color: seconds < 60 ? "crimson" : "#2457a7",
              fontSize: 22,
            }}>
              ⏱ {formatTime(seconds)}
            </strong>
          </div>

          <div style={{
            background: "#e5eaf4",
            height: 8,
            borderRadius: 20,
            margin: "20px 0",
          }}>
            <div style={{
              width: `${(answered / questions.length) * 100}%`,
              height: "100%",
              background: "#2457a7",
              borderRadius: 20,
            }} />
          </div>

          <p className="meta">Answered {answered} of {questions.length}</p>

          <h2 style={{ marginTop: 30 }}>{q.question}</h2>

          {q.options.map((option, index) => (
            <label key={index} style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: 16,
              border: answers[q.id] === index
                ? "2px solid #2457a7"
                : "1px solid #dce4f2",
              borderRadius: 12,
              margin: "12px 0",
              cursor: "pointer",
              background: answers[q.id] === index ? "#eef4ff" : "white",
            }}>
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === index}
                onChange={() => setAnswers((old) => ({
                  ...old,
                  [q.id]: index,
                }))}
              />
              <strong>{String.fromCharCode(65 + index)}.</strong>
              {option}
            </label>
          ))}

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 25,
          }}>
            <button className="btn secondary"
              disabled={current === 0}
              onClick={() => setCurrent((x) => x - 1)}>
              ← Previous
            </button>

            {current < questions.length - 1 ? (
              <button className="btn" onClick={() => setCurrent((x) => x + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn" onClick={() => {
                if (confirm("Submit your test now?")) submitTest();
              }}>
                Submit Test
              </button>
            )}
          </div>

          <h3 style={{ marginTop: 30 }}>Question Navigation</h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {questions.map((question, index) => (
              <button key={question.id}
                onClick={() => setCurrent(index)}
                style={{
                  padding: "10px 15px",
                  borderRadius: 8,
                  border: current === index
                    ? "2px solid #2457a7"
                    : "1px solid #ccd5e5",
                  background: answers[question.id] !== undefined
                    ? "#dcfce7"
                    : "white",
                  cursor: "pointer",
                }}>
                {index + 1}
              </button>
            ))}
          </div>

          <button className="btn"
            style={{ background: "#b91c1c", marginTop: 30 }}
            onClick={() => {
              if (confirm("Are you sure you want to submit the test?")) {
                submitTest();
              }
            }}>
            Submit Test
          </button>
        </section>
      )}
    </main>
  );
}
