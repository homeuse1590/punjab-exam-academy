
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Question = {
  id?: string;
  subject: string;
  exam: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  language: string;
  difficulty: string;
  published: boolean;
};

type Resource = {
  id?: string;
  type: "note" | "paper";
  title: string;
  description: string;
  file_url: string;
  storage_path?: string;
  published: boolean;
};

type Notice = {
  id?: string;
  title: string;
  body: string;
  url: string;
  published: boolean;
};

type MockTest = {
  id?: string;
  title: string;
  description: string;
  subject: string;
  duration_minutes: number;
  negative_marking: number;
  published: boolean;
};

const emptyQ: Question = {
  subject: "Punjab GK",
  exam: "PSSSB",
  question: "",
  options: ["", "", "", ""],
  answer: 0,
  explanation: "",
  language: "both",
  difficulty: "medium",
  published: false,
};

const emptyR: Resource = {
  type: "note",
  title: "",
  description: "",
  file_url: "",
  storage_path: "",
  published: false,
};

const emptyN: Notice = {
  title: "",
  body: "",
  url: "",
  published: false,
};

const emptyM: MockTest = {
  title: "",
  description: "",
  subject: "Punjab GK",
  duration_minutes: 30,
  negative_marking: 0,
  published: false,
};

type Tab = "questions" | "resources" | "notices" | "mocktests";

export default function Admin() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [session, setSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [tab, setTab] = useState<Tab>("questions");

  const [q, setQ] = useState<Question>(emptyQ);
  const [r, setR] = useState<Resource>(emptyR);
  const [n, setN] = useState<Notice>(emptyN);
  const [m, setM] = useState<MockTest>(emptyM);

  const [questions, setQuestions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);

  const [pdf, setPdf] = useState<File | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  async function load() {
    if (!supabase) return;

    const [a, b, c, d] = await Promise.all([
      supabase.from("questions").select("*")
        .order("created_at", { ascending: false }).limit(500),

      supabase.from("resources").select("*")
        .order("created_at", { ascending: false }).limit(100),

      supabase.from("notifications").select("*")
        .order("created_at", { ascending: false }).limit(100),

      supabase.from("mock_tests").select("*")
        .order("created_at", { ascending: false }).limit(100),
    ]);

    if (a.error || b.error || c.error || d.error) {
      setMsg(
        "Loading error: " +
        (a.error?.message || b.error?.message ||
          c.error?.message || d.error?.message)
      );
      return;
    }

    setQuestions(a.data || []);
    setResources(b.data || []);
    setNotices(c.data || []);
    setMockTests(d.data || []);
  }

  async function login() {
    if (!supabase) {
      setMsg("Configure Supabase in .env.local.");
      return;
    }

    if (!email.trim() || !pass) {
      setMsg("Enter email and password.");
      return;
    }

    setBusy(true);
    setMsg("");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

    if (error || !data.user) {
      setMsg("Login failed. Check credentials.");
      setBusy(false);
      return;
    }

    const { data: profile, error: pe } =
      await supabase.from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

    if (pe || profile?.role !== "admin") {
      await supabase.auth.signOut();
      setMsg("Access denied: administrator only.");
      setBusy(false);
      return;
    }

    setSession(true);
    setMsg("Administrator verified.");
    setBusy(false);
    await load();
  }

  async function saveQuestion() {
    if (
      !supabase ||
      !q.question.trim() ||
      q.options.some((x) => !x.trim()) ||
      q.answer < 0 ||
      q.answer > 3
    ) {
      setMsg("Fill question and all four options.");
      return;
    }

    setBusy(true);

    const res = q.id
      ? await supabase.from("questions").update(q).eq("id", q.id)
      : await supabase.from("questions").insert(q);

    setMsg(res.error ? res.error.message : "Question saved.");

    if (!res.error) {
      setQ(emptyQ);
      await load();
    }

    setBusy(false);
  }

  async function uploadPDF() {
    if (!supabase || !pdf) {
      setMsg("Select a PDF file first.");
      return;
    }

    if (pdf.type !== "application/pdf") {
      setMsg("Only PDF files are allowed.");
      return;
    }

    if (pdf.size > 20 * 1024 * 1024) {
      setMsg("PDF must be smaller than 20 MB.");
      return;
    }

    setBusy(true);
    setMsg("Uploading PDF...");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMsg("Please sign in again.");
      setBusy(false);
      return;
    }

    const safeName = pdf.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userData.user.id}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("study-resources")
      .upload(path, pdf, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      setMsg("Upload failed: " + error.message);
      setBusy(false);
      return;
    }

    setR((old) => ({
      ...old,
      storage_path: path,
      file_url: "",
    }));

    setPdf(null);
    setMsg("PDF uploaded successfully. Now save the resource.");
    setBusy(false);
  }

  async function saveResource() {
    if (!supabase || !r.title.trim()) {
      setMsg("Resource title is required.");
      return;
    }

    setBusy(true);

    const payload = {
      type: r.type,
      title: r.title,
      description: r.description,
      file_url: r.file_url,
      storage_path: r.storage_path || null,
      published: r.published,
    };

    const res = r.id
      ? await supabase.from("resources")
          .update(payload).eq("id", r.id)
      : await supabase.from("resources").insert(payload);

    if (res.error) {
      setMsg("Save failed: " + res.error.message);
      setBusy(false);
      return;
    }

    setMsg("Resource saved successfully.");
    setR(emptyR);
    setPdf(null);
    await load();
    setBusy(false);
  }

  async function saveNotice() {
    if (!supabase || !n.title.trim() || !n.body.trim()) {
      setMsg("Notice title and body are required.");
      return;
    }

    setBusy(true);

    const res = n.id
      ? await supabase.from("notifications").update(n).eq("id", n.id)
      : await supabase.from("notifications").insert(n);

    setMsg(res.error ? res.error.message : "Notice saved.");

    if (!res.error) {
      setN(emptyN);
      await load();
    }

    setBusy(false);
  }

  // MOCK TEST BUILDER

  async function editMockTest(test: any) {
    if (!supabase) return;

    setBusy(true);
    setMsg("");

    const { data, error } = await supabase
      .from("mock_test_questions")
      .select("question_id, question_order")
      .eq("mock_test_id", test.id)
      .order("question_order");

    if (error) {
      setMsg("Could not load test questions: " + error.message);
      setBusy(false);
      return;
    }

    setM({
      id: test.id,
      title: test.title,
      description: test.description || "",
      subject: test.subject || "General",
      duration_minutes: test.duration_minutes,
      negative_marking: Number(test.negative_marking || 0),
      published: test.published,
    });

    setSelectedQuestions(
      (data || []).map((x: any) => x.question_id)
    );

    setMsg("Mock test loaded for editing.");
    setBusy(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleQuestion(id: string) {
    setSelectedQuestions((old) =>
      old.includes(id)
        ? old.filter((x) => x !== id)
        : [...old, id]
    );
  }

  async function saveMockTest() {
    if (!supabase) return;

    if (!m.title.trim()) {
      setMsg("Mock test title is required.");
      return;
    }

    if (selectedQuestions.length === 0) {
      setMsg("Select at least one question.");
      return;
    }

    if (
      m.duration_minutes < 1 ||
      m.duration_minutes > 300 ||
      m.negative_marking < 0 ||
      m.negative_marking > 1
    ) {
      setMsg("Check duration and negative marking values.");
      return;
    }

    setBusy(true);
    setMsg("Saving mock test...");

    const payload = {
      title: m.title.trim(),
      description: m.description.trim(),
      subject: m.subject.trim() || "General",
      duration_minutes: Number(m.duration_minutes),
      negative_marking: Number(m.negative_marking),
      published: m.published,
    };

    let testId = m.id;

    if (testId) {
      const { error } = await supabase
        .from("mock_tests")
        .update(payload)
        .eq("id", testId);

      if (error) {
        setMsg("Test update failed: " + error.message);
        setBusy(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("mock_tests")
        .insert(payload)
        .select("id")
        .single();

      if (error || !data) {
        setMsg("Test creation failed: " + (error?.message || ""));
        setBusy(false);
        return;
      }

      testId = data.id;
    }

    // Replace existing question assignments.
    const { error: deleteError } = await supabase
      .from("mock_test_questions")
      .delete()
      .eq("mock_test_id", testId);

    if (deleteError) {
      setMsg("Could not update question assignments: " + deleteError.message);
      setBusy(false);
      return;
    }

    const assignments = selectedQuestions.map((questionId, index) => ({
      mock_test_id: testId,
      question_id: questionId,
      question_order: index + 1,
    }));

    const { error: insertError } = await supabase
      .from("mock_test_questions")
      .insert(assignments);

    if (insertError) {
      setMsg("Questions assignment failed: " + insertError.message);
      setBusy(false);
      return;
    }

    setMsg("Mock test saved successfully.");
    setM(emptyM);
    setSelectedQuestions([]);
    await load();
    setBusy(false);
  }

  async function removeMockTest(id: string) {
    if (!supabase || !confirm("Delete this mock test permanently?")) return;

    setBusy(true);

    const { error } = await supabase
      .from("mock_tests")
      .delete()
      .eq("id", id);

    setMsg(error ? error.message : "Mock test deleted.");

    if (!error) {
      if (m.id === id) {
        setM(emptyM);
        setSelectedQuestions([]);
      }
      await load();
    }

    setBusy(false);
  }

  async function remove(
    table: "questions" | "resources" | "notifications",
    id: string
  ) {
    if (!supabase || !confirm("Delete this item permanently?")) return;

    setBusy(true);

    if (table === "resources") {
      const resource = resources.find((x) => x.id === id);

      if (resource?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from("study-resources")
          .remove([resource.storage_path]);

        if (storageError) {
          setMsg("PDF deletion failed: " + storageError.message);
          setBusy(false);
          return;
        }
      }
    }

    const { error } = await supabase.from(table).delete().eq("id", id);

    setMsg(error ? error.message : "Deleted.");

    if (!error) await load();

    setBusy(false);
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setSession(false);
    setPass("");
    setMsg("Signed out.");
  }

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;

      const { data: profile } = await supabase.from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        setSession(true);
        await load();
      }
    });
  }, []);

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void
  ) => (
    <label style={{ display: "block", margin: "10px 0" }}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ display: "block", width: "100%" }}
      />
    </label>
  );

  return (
    <main className="wrap" style={{ padding: "35px 22px 60px" }}>
      <Link href="/">← Home</Link>
      <h1>Admin Dashboard</h1>

      {!session ? (
        <div className="card" style={{ maxWidth: 520 }}>
          <h3>Administrator sign-in</h3>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button className="btn" disabled={busy} onClick={login}>
            {busy ? "Verifying..." : "Sign in"}
          </button>
        </div>
      ) : (
        <>
          <div className="tools">
            <button className="btn secondary" onClick={() => setTab("questions")}>
              MCQs ({questions.length})
            </button>

            <button className="btn secondary" onClick={() => setTab("resources")}>
              Notes/Papers ({resources.length})
            </button>

            <button className="btn secondary" onClick={() => setTab("notices")}>
              Notices ({notices.length})
            </button>

            <button className="btn secondary" onClick={() => setTab("mocktests")}>
              Mock Tests ({mockTests.length})
            </button>

            <button className="btn" onClick={logout}>Logout</button>
          </div>

          {/* MCQs */}
          {tab === "questions" && (
            <div className="card">
              <h2>{q.id ? "Edit MCQ" : "Add MCQ"}</h2>

              {field("Subject", q.subject, (v) => setQ({ ...q, subject: v }))}
              {field("Exam", q.exam, (v) => setQ({ ...q, exam: v }))}
              {field("Question", q.question, (v) => setQ({ ...q, question: v }))}

              {q.options.map((o, i) =>
                field("Option " + String.fromCharCode(65 + i), o,
                  (v) => setQ({
                    ...q,
                    options: q.options.map((x, j) => j === i ? v : x),
                  })
                )
              )}

              <label>Correct option
                <select value={q.answer}
                  onChange={(e) => setQ({ ...q, answer: Number(e.target.value) })}>
                  {q.options.map((_, i) => (
                    <option value={i} key={i}>
                      {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </label>

              {field("Explanation", q.explanation, (v) => setQ({ ...q, explanation: v }))}

              <label>Language
                <select value={q.language}
                  onChange={(e) => setQ({ ...q, language: e.target.value })}>
                  <option value="both">Both</option>
                  <option value="en">English</option>
                  <option value="pa">Punjabi</option>
                </select>
              </label>

              <label>Difficulty
                <select value={q.difficulty}
                  onChange={(e) => setQ({ ...q, difficulty: e.target.value })}>
                  <option>easy</option>
                  <option>medium</option>
                  <option>hard</option>
                </select>
              </label>

              <label>
                <input type="checkbox" checked={q.published}
                  onChange={(e) => setQ({ ...q, published: e.target.checked })} />
                Publish
              </label>

              <button className="btn" disabled={busy} onClick={saveQuestion}>Save MCQ</button>
              <button className="btn secondary" onClick={() => setQ(emptyQ)}>Clear</button>
            </div>
          )}

          {/* RESOURCES */}
          {tab === "resources" && (
            <div className="card">
              <h2>{r.id ? "Edit Resource" : "Add Study Resource"}</h2>

              <label>Type
                <select value={r.type}
                  onChange={(e) => setR({ ...r, type: e.target.value as "note" | "paper" })}>
                  <option value="note">Study Note</option>
                  <option value="paper">Previous Paper</option>
                </select>
              </label>

              {field("Title", r.title, (v) => setR({ ...r, title: v }))}
              {field("Description", r.description, (v) => setR({ ...r, description: v }))}

              <h3>Upload PDF from computer</h3>
              <input type="file" accept="application/pdf,.pdf"
                onChange={(e) => setPdf(e.target.files?.[0] || null)} />

              <button className="btn" disabled={busy || !pdf} onClick={uploadPDF}>
                {busy ? "Processing..." : "Upload PDF"}
              </button>

              {r.storage_path && (
                <p style={{ color: "green", overflowWrap: "anywhere" }}>
                  Uploaded PDF: {r.storage_path}
                </p>
              )}

              <p className="meta">Maximum PDF size: 20 MB.</p>

              <h3>Or use an external PDF link</h3>
              {field("External File URL", r.file_url, (v) => setR({ ...r, file_url: v }))}

              <label>
                <input type="checkbox" checked={r.published}
                  onChange={(e) => setR({ ...r, published: e.target.checked })} />
                Publish
              </label>

              <button className="btn" disabled={busy} onClick={saveResource}>Save Resource</button>
              <button className="btn secondary" onClick={() => { setR(emptyR); setPdf(null); }}>
                Clear
              </button>
            </div>
          )}

          {/* NOTICES */}
          {tab === "notices" && (
            <div className="card">
              <h2>Add/Edit Notice</h2>

              {field("Title", n.title, (v) => setN({ ...n, title: v }))}
              {field("Notice body", n.body, (v) => setN({ ...n, body: v }))}
              {field("Official URL", n.url, (v) => setN({ ...n, url: v }))}

              <label>
                <input type="checkbox" checked={n.published}
                  onChange={(e) => setN({ ...n, published: e.target.checked })} />
                Publish
              </label>

              <button className="btn" disabled={busy} onClick={saveNotice}>Save Notice</button>
              <button className="btn secondary" onClick={() => setN(emptyN)}>Clear</button>
            </div>
          )}

          {/* MOCK TEST BUILDER */}
          {tab === "mocktests" && (
            <>
              <div className="card">
                <h2>{m.id ? "Edit Mock Test" : "Create Mock Test"}</h2>

                {field("Mock Test Title", m.title,
                  (v) => setM({ ...m, title: v }))}

                {field("Description", m.description,
                  (v) => setM({ ...m, description: v }))}

                {field("Subject", m.subject,
                  (v) => setM({ ...m, subject: v }))}

                <label style={{ display: "block", margin: "12px 0" }}>
                  Duration (minutes)
                  <input type="number" min="1" max="300"
                    value={m.duration_minutes}
                    onChange={(e) => setM({
                      ...m, duration_minutes: Number(e.target.value),
                    })}
                    style={{ display: "block", width: "100%" }} />
                </label>

                <label style={{ display: "block", margin: "12px 0" }}>
                  Negative marking per wrong answer
                  <select value={m.negative_marking}
                    onChange={(e) => setM({
                      ...m, negative_marking: Number(e.target.value),
                    })}>
                    <option value={0}>No negative marking</option>
                    <option value={0.25}>-0.25 marks</option>
                    <option value={0.33}>-0.33 marks</option>
                    <option value={0.5}>-0.50 marks</option>
                    <option value={1}>-1 mark</option>
                  </select>
                </label>

                <label style={{ display: "block", margin: "12px 0" }}>
                  <input type="checkbox" checked={m.published}
                    onChange={(e) => setM({ ...m, published: e.target.checked })} />
                  Publish mock test
                </label>

                <hr />

                <h3>Select Questions</h3>
                <p>
                  Selected: <strong>{selectedQuestions.length}</strong>
                </p>

                {questions.filter((x) => x.published).length === 0 ? (
                  <p>No published questions available. Publish MCQs first.</p>
                ) : (
                  <div style={{ maxHeight: 500, overflowY: "auto" }}>
                    {questions.filter((x) => x.published).map((x) => (
                      <label key={x.id}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                          padding: 12,
                          marginBottom: 8,
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}>
                        <input type="checkbox"
                          checked={selectedQuestions.includes(x.id)}
                          onChange={() => toggleQuestion(x.id)}
                          style={{ marginTop: 5 }} />

                        <span>
                          <strong>{x.subject}</strong>
                          <br />
                          {x.question}
                          <br />
                          <small>{x.exam} · {x.difficulty}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <button className="btn" disabled={busy} onClick={saveMockTest}>
                  {busy ? "Saving..." : "Save Mock Test"}
                </button>

                <button className="btn secondary" onClick={() => {
                  setM(emptyM);
                  setSelectedQuestions([]);
                }}>
                  Clear Form
                </button>
              </div>

              <h2>Existing Mock Tests</h2>

              {mockTests.length === 0 && (
                <p>No mock tests created yet.</p>
              )}

              {mockTests.map((x) => (
                <article className="card" key={x.id}>
                  <h3>{x.title}</h3>
                  <p>{x.subject} · {x.duration_minutes} minutes</p>
                  <p>
                    Negative marking: -{x.negative_marking}
                  </p>
                  <p>
                    {x.published ? "Published" : "Draft"}
                  </p>

                  <button className="btn secondary"
                    disabled={busy} onClick={() => editMockTest(x)}>
                    Edit
                  </button>

                  <button className="btn secondary"
                    disabled={busy} onClick={() => removeMockTest(x.id)}>
                    Delete
                  </button>
                </article>
              ))}
            </>
          )}

          {/* EXISTING CONTENT LISTS */}
          {tab === "questions" && (
            <>
              <h2>Existing MCQs</h2>
              {questions.map((x) => (
                <article className="card" key={x.id}>
                  <b>{x.subject} · {x.question}</b>
                  <p>{x.published ? "Published" : "Draft"}</p>
                  <button onClick={() => setQ(x)}>Edit</button>
                  <button disabled={busy} onClick={() => remove("questions", x.id)}>Delete</button>
                </article>
              ))}
            </>
          )}

          {tab === "resources" && (
            <>
              <h2>Existing Resources</h2>
              {resources.map((x) => (
                <article className="card" key={x.id}>
                  <b>{x.type} · {x.title}</b>
                  <p>{x.published ? "Published" : "Draft"}</p>
                  <p>{x.storage_path ? "Uploaded PDF" : x.file_url || "No file"}</p>
                  <button onClick={() => { setR(x); setPdf(null); }}>Edit</button>
                  <button disabled={busy} onClick={() => remove("resources", x.id)}>Delete</button>
                </article>
              ))}
            </>
          )}

          {tab === "notices" && (
            <>
              <h2>Existing Notices</h2>
              {notices.map((x) => (
                <article className="card" key={x.id}>
                  <b>{x.title}</b>
                  <p>{x.published ? "Published" : "Draft"}</p>
                  <button onClick={() => setN(x)}>Edit</button>
                  <button disabled={busy} onClick={() => remove("notifications", x.id)}>Delete</button>
                </article>
              ))}
            </>
          )}
        </>
      )}

      {msg && <p role="status" aria-live="polite">{msg}</p>}

      <p className="meta">
        Administrator actions are protected by Supabase RLS.
      </p>
    </main>
  );
}
