
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  storage_path: string | null;
  created_at: string;
};

export default function Papers() {
  const [rows, setRows] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPapers() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("resources")
        .select("id,title,description,file_url,storage_path,created_at")
        .eq("type", "paper")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setRows((data || []) as Resource[]);
      setLoading(false);
    }

    loadPapers();
  }, []);

  function getPdfUrl(resource: Resource) {
    if (resource.file_url?.trim()) {
      return resource.file_url;
    }

    if (resource.storage_path && supabase) {
      const { data } = supabase.storage
        .from("study-resources")
        .getPublicUrl(resource.storage_path);

      return data.publicUrl;
    }

    return "";
  }

  return (
    <main className="wrap" style={{ padding: "35px 22px 60px" }}>
      <Link href="/">← Home</Link>

      <p className="eyebrow" style={{ marginTop: 25 }}>
        PUNJAB EXAM ACADEMY
      </p>

      <h1>Previous Papers / ਪਿਛਲੇ ਪੇਪਰ</h1>

      <p>
        Previous examination papers for Punjab competitive examinations.
        ਪੰਜਾਬ ਦੀਆਂ ਮੁਕਾਬਲੇ ਦੀਆਂ ਪ੍ਰੀਖਿਆਵਾਂ ਦੇ ਪਿਛਲੇ ਪੇਪਰ।
      </p>

      <section className="card" style={{ marginTop: 25 }}>
        <h2>Previous Papers Library</h2>

        {loading && <p>Loading published papers...</p>}

        {error && (
          <div style={{ color: "red", marginTop: 15 }}>
            <strong>Unable to load previous papers.</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div>
            <p>No previous papers are available yet.</p>
            <p>Published papers will appear here automatically.</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="grid3" style={{ marginTop: 20 }}>
            {rows.map((resource) => {
              const pdfUrl = getPdfUrl(resource);

              return (
                <article className="card" key={resource.id}>
                  <h3>{resource.title}</h3>

                  <p>{resource.description || "Previous examination paper"}</p>

                  {pdfUrl ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <a
                        className="btn"
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open PDF
                      </a>

                      <a
                        className="btn secondary"
                        href={pdfUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  ) : (
                    <p style={{ color: "#b45309" }}>
                      PDF link is missing for this resource.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
