
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const categories = [
  ["🧭", "Punjab GK", "History, geography, culture, districts and state facts.", "/quiz?subject=Punjab%20GK"],
  ["📘", "PSSSB Preparation", "Syllabus-focused practice for PSSSB recruitment exams.", "/quiz?subject=PSSSB"],
  ["🧮", "Reasoning & Maths", "Practice aptitude, reasoning and quantitative topics.", "/quiz?subject=Reasoning"],
  ["💻", "Computer Knowledge", "Fundamentals, office tools, internet and IT MCQs.", "/quiz?subject=Computer"],
];

const resources = [
  ["📄", "Study Notes", "Topic-wise concise notes in Punjabi and English.", "/notes"],
  ["📝", "MCQ Practice", "Instant answer feedback and explanations.", "/quiz"],
  ["⏱️", "Mock Tests", "Timed practice tests with score review.", "/mock-tests"],
  ["📚", "Previous Papers", "Exam papers and downloadable resources.", "/papers"],
];

export default function Home() {
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    async function checkSession() {
      const { data } = await supabase!.auth.getSession();

      if (active) {
        setStudent(data.session?.user ?? null);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setStudent(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <div className="top">
        <div className="wrap">
          <span>Punjab competitive exams • Punjabi + English</span>
          <span>Free learning resources for every aspirant</span>
        </div>
      </div>

      <div className="hero">
        <div className="wrap heroGrid">
          <div>
            <div className="eyebrow">
              Your preparation. Your progress. Your future.
            </div>

            <h1>
              Prepare smarter.
              <br />
              Achieve more.
            </h1>

            <p>
              One focused platform for Punjab GK, PSSSB,
              Patwari, Senior Assistant and other Punjab
              competitive examinations—with practice,
              notes and tests in one place.
            </p>

            <div className="heroActions">
              <Link className="btn gold" href="/quiz">
                Start Free Practice →
              </Link>

              <Link className="btn secondary" href="/notes">
                Explore Study Notes
              </Link>
            </div>

            <div className="heroStats">
              <div className="stat">
                <strong>Free</strong>
                <span>Learning access</span>
              </div>

              <div className="stat">
                <strong>2 Languages</strong>
                <span>Punjabi & English</span>
              </div>

              <div className="stat">
                <strong>All-in-one</strong>
                <span>Preparation hub</span>
              </div>
            </div>
          </div>

          <div className="heroPanel">
            <div className="panelHead">
              <b>Quick access</b>
              <span className="pill">Start today</span>
            </div>

            <div className="quick">
              <Link href="/quiz">
                <b>📝</b>Daily MCQs
              </Link>

              <Link href="/mock-tests">
                <b>⏱️</b>Mock tests
              </Link>

              <Link href="/notes">
                <b>📖</b>Study notes
              </Link>

              <Link href="/papers">
                <b>📚</b>Past papers
              </Link>
            </div>

            <p style={{ fontSize: 12, marginTop: 18 }}>
              Build consistency with focused daily practice.
            </p>
          </div>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="sectionHead">
            <div>
              <h2>Prepare by subject</h2>
              <p>
                Choose a subject and begin structured practice.
              </p>
            </div>

            <Link href="/quiz">All MCQs →</Link>
          </div>

          <div className="grid4">
            {categories.map(([icon, title, desc, url]) => (
              <Link className="card" href={url} key={title}>
                <div className="cardIcon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="meta">Explore practice →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sectionHead">
            <div>
              <h2>Learning resources</h2>
              <p>
                Practice, revise and assess your preparation.
              </p>
            </div>
          </div>

          <div className="grid4">
            {resources.map(([icon, title, desc, url]) => (
              <Link className="card" href={url} key={title}>
                <div className="cardIcon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="meta">Open resource →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="banner">
            <div>
              <h3>Make practice a daily habit</h3>
              <p>
                Attempt a short quiz, review explanations
                and track what you need to revise.
              </p>
            </div>

            <Link className="btn" href="/quiz">
              Practice MCQs →
            </Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot">
          <div>
            <b>Punjab Exam Academy</b>
            <p>
              Free preparation resources for Punjab
              competitive examinations.
            </p>
          </div>

          <div>
            <Link href="/about">About</Link> ·{" "}
            <Link href="/account">Student Account</Link> ·{" "}
            <Link href="/notifications">Notifications</Link> ·{" "}
            <Link href="/admin">Admin</Link> ·{" "}
            <Link href="/privacy">Privacy</Link> ·{" "}
            <Link href="/terms">Terms</Link>

            <p>
              Verify official recruitment details from
              the relevant department.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
