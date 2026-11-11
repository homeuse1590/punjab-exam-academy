"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const qs = [
  ["Punjab's capital is:", ["Amritsar", "Chandigarh", "Patiala", "Ludhiana"], 1],
  ["Golden Temple is in:", ["Amritsar", "Jalandhar", "Bathinda", "Moga"], 0],
  ["CPU stands for:", ["Central Processing Unit", "Computer Power Unit", "Central Print Utility", "Control Program Unit"], 0],
  ["15% of 200 equals:", ["20", "25", "30", "35"], 2],
  ["Ctrl+C is used to:", ["Cut", "Copy", "Paste", "Undo"], 1],
  ["Constitution came into effect on:", ["15 Aug 1947", "26 Jan 1950", "26 Nov 1949", "2 Oct 1950"], 1],
  ["Next number: 3,6,12,24,__", ["30", "36", "48", "42"], 2],
  ["Synonym of Rapid:", ["Slow", "Quick", "Late", "Weak"], 1],
  ["'ਪਾਣੀ' ਦਾ ਸਮਾਨਾਰਥਕ:", ["ਜਲ", "ਅੱਗ", "ਹਵਾ", "ਮਿੱਟੀ"], 0],
  ["Keyboard is a:", ["Output device", "Input device", "Storage", "Network"], 1],
] as const;
export default function MockTests() {
  const [started, setStarted] = useState(false); const [sec, setSec] = useState(600); const [answers, setAnswers] = useState<Record<number, number>>({}); const [done, setDone] = useState(false);
  useEffect(() => { if (!started || done) return; const t = setInterval(() => setSec(s => { if (s <= 1) { setDone(true); return 0; } return s - 1; }), 1000); return () => clearInterval(t); }, [started, done]);
  const score = qs.reduce((n, q, i) => n + (answers[i] === q[2] ? 1 : 0), 0);
  const time = `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
  return <main className="wrap" style={{ padding: "32px 22px 60px" }}><Link href="/">← Home</Link><h1>Mock Tests / ਮੌਕ ਟੈਸਟ</h1><p>10-question demo test · 10 minutes · 1 mark per question · no negative marking</p>
    {!started ? <div className="card"><h2>Punjab Exam Academy Practice Test</h2><ul><li>10 mixed-subject questions</li><li>10-minute countdown</li><li>Answers saved while you attempt</li><li>Automatic submission when time ends</li></ul><button className="btn" onClick={() => setStarted(true)}>Start Test →</button></div> : done ? <div className="card"><h2>Test completed</h2><h3>Score: {score}/{qs.length} ({Math.round(score / qs.length * 100)}%)</h3>{qs.map((q, i) => <article key={i} style={{ padding: "12px 0", borderTop: "1px solid #e4eaf2" }}><b>{i + 1}. {q[0]}</b><p>Your answer: {q[1][answers[i]] ?? "Not attempted"} · Correct: {q[1][q[2]]}</p></article>)}<button className="btn" onClick={() => { setStarted(false); setDone(false); setSec(600); setAnswers({}); }}>Retake test</button></div> : <div className="qbox"><div className="sectionHead"><b>Mock Test</b><span className="pill">Time remaining: {time}</span></div>{qs.map((q, i) => <section key={i} style={{ padding: "16px 0", borderBottom: "1px solid #e4eaf2" }}><b>{i + 1}. {q[0]}</b>{q[1].map((o, j) => <label key={j} style={{ display: "block", padding: 7 }}><input type="radio" name={`q${i}`} checked={answers[i] === j} onChange={() => setAnswers(a => ({ ...a, [i]: j }))}/> {String.fromCharCode(65 + j)}. {o}</label>)}</section>)}<button className="btn" style={{ marginTop: 18 }} onClick={() => setDone(true)}>Submit Test</button></div>}
  </main>;
}
