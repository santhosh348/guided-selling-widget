import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { TavilyClient } from "tavily";
import { AskSchema } from "@/lib/zod";
import { rankBySimilarity, type Chunk } from "@/lib/embedding";

type WebSource = { title: string; url: string; snippet?: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const parsed = AskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const { question, product, faqs = [], enableWebSearch = false } = parsed.data;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const tavily = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY || "" });

    // Build chunks from product data + FAQs
    const chunks: Chunk[] = [];
    chunks.push({ id: "title", text: `Title: ${product.title}` });
    if (product.sku) chunks.push({ id: "sku", text: `SKU: ${product.sku}` });
    if (product.description) chunks.push({ id: "description", text: `Description: ${product.description}` });
    if (product.features?.length) chunks.push({ id: "features", text: `Features: ${product.features.join("; ")}` });
    if (product.specs) {
      Object.entries(product.specs).forEach(([k, v]) => chunks.push({ id: `spec_${k}`, text: `Spec ${k}: ${String(v)}` }));
    }
    faqs.forEach((f, i) => chunks.push({ id: `faq_${i}`, text: `FAQ Q: ${f.q}
FAQ A: ${f.a}` }));

    const top = await rankBySimilarity(openai, question, chunks, 8);
    const localContext = top.map(t => t.text).join("\n");

    // Optional: web search
    let webSources: WebSource[] = [];
    if (enableWebSearch && process.env.TAVILY_API_KEY) {
      const q = [product.title, product.sku, question].filter(Boolean).join(" ");
      const domainsEnv = (process.env.ALLOWED_SEARCH_DOMAINS || "").trim();
      const domains = domainsEnv ? domainsEnv.split(",").map(s => s.trim()).filter(Boolean) : undefined;
      const search = await tavily.search(q, {
        maxResults: 5,
        includeDomains: domains,
        searchDepth: "advanced"
      });
      webSources = (search.results || []).map(r => ({ title: r.title, url: r.url, snippet: r.content }));
    }

    // Compose prompt
    const system = `You are a helpful product expert. Answer clearly and concisely.
- Prioritize official product data given in CONTEXT.
- If WEB SOURCES provided, you may use them for extra facts. Cite with [n] and include sources array.
- If you are unsure, say so and suggest next steps.
- NEVER hallucinate specs. Keep to what's given and high-confidence web facts.`;

    const user = `QUESTION: ${question}

CONTEXT:
${localContext || "(no local context)"}${webSources.length ? "\n\nWEB SOURCES:\n" + webSources.map((s, i) => f"[{i+1}] {s.title} — {s.url}\n{(s.snippet||'').slice(0,300)}").join("\n\n") : ""}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    const answer = completion.choices[0].message?.content || "Sorry, I couldn't generate an answer.";
    res.status(200).json({ answer, sources: webSources });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err?.message });
  }
}
