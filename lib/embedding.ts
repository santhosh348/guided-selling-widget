import OpenAI from "openai";

export type Chunk = { id: string; text: string; meta?: Record<string, any> };
export type ScoredChunk = Chunk & { score: number };

const EMBEDDING_MODEL = "text-embedding-3-small";

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const mag = (a: number[]) => Math.sqrt(dot(a, a));
const cosSim = (a: number[], b: number[]) => dot(a, b) / (mag(a) * mag(b) + 1e-12);

export async function embed(openai: OpenAI, input: string | string[]) {
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input });
  return Array.isArray(input) ? res.data.map(d => d.embedding) : res.data[0].embedding;
}

export async function rankBySimilarity(openai: OpenAI, query: string, chunks: Chunk[], topK = 6): Promise<ScoredChunk[]> {
  if (!chunks.length) return [];
  const [qVec, cVecs] = await Promise.all([
    embed(openai, query),
    embed(openai, chunks.map(c => c.text))
  ]);
  const scores = cVecs.map((vec, i) => ({
    ...chunks[i],
    score: cosSim(qVec as number[], vec as number[])
  }));
  return scores.sort((a, b) => b.score - a.score).slice(0, topK);
}
