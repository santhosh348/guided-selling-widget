"use client";
import React, { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

type FAQ = { q: string; a: string };
type Product = {
  title: string;
  sku?: string;
  description?: string;
  features?: string[];
  specs?: Record<string, any>;
};

type Props = {
  product: Product;
  faqs?: FAQ[];
  enableWebSearch?: boolean;
};

export default function GuidedSellingWidget({ product, faqs = [], enableWebSearch = false }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setLoading(true);
    setAnswer(null);
    setError(null);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, product, faqs, enableWebSearch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl rounded-2xl shadow-lg p-4 border bg-white">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Guided Selling</h3>
      </div>

      {faqs?.length ? (
        <div className="mb-4">
          <h4 className="font-medium mb-2">FAQs</h4>
          <div className="space-y-2">
            {faqs.slice(0, 5).map((f, i) => (
              <details key={i} className="border rounded-xl p-3">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-sm text-neutral-700">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about compatibility, capacity, warranty, etc."
          className="flex-1 border rounded-xl px-3 py-2 focus:outline-none"
        />
        <button
          onClick={ask}
          disabled={!question || loading}
          className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Ask
        </button>
      </div>

      <div className="mt-4 min-h-[80px]">
        {loading && <p className="text-sm">Thinking…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {answer && (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{answer}</div>
            {sources?.length ? (
              <div className="mt-3">
                <p className="text-xs font-medium">Sources</p>
                <ul className="list-disc pl-5 text-xs">
                  {sources.map((s, i) => (
                    <li key={i}>
                      <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                        [{i + 1}] {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
