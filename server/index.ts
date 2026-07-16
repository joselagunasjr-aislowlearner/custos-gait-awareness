import express from "express";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  GptSummarySchema,
  validateSummaryGrounding,
} from "../src/lib/summary";

const MetricSchema = z.object({
  mean: z.number(),
  standardDeviation: z.number(),
  sampleSize: z.number(),
});

const FeatureSchema = z.object({
  observationId: z.string(),
  capturedAt: z.string(),
  stepCount: z.number(),
  cadenceSpm: z.number().nullable(),
  stepIntervalVariabilityPct: z.number().nullable(),
  impactEnergy: z
    .object({
      q25: z.number(),
      median: z.number(),
      q75: z.number(),
      spreadPct: z.number(),
    })
    .nullable(),
  transitionDurationSec: z.number().nullable(),
  sensorConfidence: z.number(),
  availableSensors: z.array(z.string()),
  missingSensors: z.array(z.string()),
  provenance: z.record(z.string(), z.enum(["measured", "derived", "simulated", "synthetic"])),
  rawAudioRetained: z.literal(false),
}).strict();

const InterpretRequestSchema = z.object({
  assessment: z.object({
    state: z.enum([
      "stable",
      "isolated-anomaly",
      "sustained-change",
      "insufficient-data",
      "low-confidence",
      "unknown-occupant",
    ]),
    confidence: z.number(),
    headline: z.string(),
    explanation: z.string(),
    changedFeatures: z.array(z.unknown()),
    recentObservationIds: z.array(z.string()),
    evidenceWindow: z.number(),
    caveats: z.array(z.string()),
  }),
  baseline: z.object({
    observationIds: z.array(z.string()),
    established: z.boolean(),
    reason: z.string().optional(),
    metrics: z.object({
      cadenceSpm: MetricSchema.optional(),
      stepIntervalVariabilityPct: MetricSchema.optional(),
      impactEnergyMedian: MetricSchema.optional(),
      transitionDurationSec: MetricSchema.optional(),
    }),
    confidence: z.number(),
  }),
  features: z.array(FeatureSchema).min(1).max(30),
}).strict();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "96kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, model: "gpt-5.6", rawAudioAccepted: false });
});

app.post("/api/interpret", async (request, response) => {
  const parsed = InterpretRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Only validated derived gait evidence is accepted." });
    return;
  }
  const credential = process.env.OPENAI_API_KEY;
  if (!credential) {
    response.status(503).json({
      error: "Live GPT mode is not configured. The deterministic offline demonstration remains available.",
    });
    return;
  }

  const { assessment, baseline, features } = parsed.data;
  const latest = features[features.length - 1];
  try {
    const client = new OpenAI({ apiKey: credential });
    const result = await client.responses.parse({
      model: "gpt-5.6",
      input: [
        {
          role: "system",
          content:
            "You interpret structured longitudinal gait measurements for a non-medical research prototype. Preserve the supplied awareness state. Explain only measurements present in the input. Distinguish measured, derived, simulated, and synthetic evidence. Never diagnose, predict, name a health condition, claim clinical accuracy, or infer a fall. Use activity-awareness and safety-consultation language. State uncertainty plainly. If evidence is insufficient, say so. Keep the response concise.",
        },
        {
          role: "user",
          content: JSON.stringify({
            deterministicAssessment: assessment,
            personalBaseline: baseline,
            longitudinalDerivedFeatures: features,
            privacy: { rawAudioUploaded: false, rawAudioRetained: false },
          }),
        },
      ],
      text: { format: zodTextFormat(GptSummarySchema, "gait_awareness_summary") },
    });
    const summary = result.output_parsed;
    if (!summary) {
      response.status(502).json({ error: "GPT returned no validated structured summary." });
      return;
    }
    const grounding = validateSummaryGrounding(
      summary,
      assessment.state,
      baseline,
      latest,
    );
    if (!grounding.valid) {
      response.status(422).json({ error: "GPT output was rejected by the evidence-grounding guardrail." });
      return;
    }
    response.setHeader("cache-control", "no-store");
    response.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown API error";
    console.error("GPT interpretation failed:", message.replace(credential, "[redacted]"));
    response.status(502).json({ error: "GPT interpretation failed; offline evidence remains available." });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, "127.0.0.1", () => {
  console.log(`Custos Gait Awareness API listening on http://127.0.0.1:${port}`);
});
