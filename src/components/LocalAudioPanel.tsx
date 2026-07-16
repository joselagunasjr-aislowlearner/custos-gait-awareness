import { useRef, useState } from "react";
import { analyzeLocalAudio, type LocalAudioResult } from "../lib/audio";
import { deriveFeatures } from "../lib/features";
import type { GaitFeatures, Observation } from "../types";

export function LocalAudioPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [result, setResult] = useState<LocalAudioResult | null>(null);
  const [features, setFeatures] = useState<GaitFeatures | null>(null);
  const [message, setMessage] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus("working");
    setMessage("Decoding and deriving footfall timing in this browser…");
    try {
      const analysis = await analyzeLocalAudio(file);
      setResult(analysis);
      if (analysis.footsteps) {
        const observation: Observation = {
          id: "local-audio-preview",
          capturedAt: new Date().toISOString(),
          label: "Local audio preview",
          occupantConfidence: 1,
          occupantKnown: true,
          footsteps: analysis.footsteps,
          rawAudioRetained: false,
          provenance: "measured",
        };
        setFeatures(deriveFeatures(observation));
      } else {
        setFeatures(null);
      }
      setMessage(analysis.message);
      setStatus("done");
    } catch {
      setResult(null);
      setFeatures(null);
      setMessage("This browser could not decode that file. Try WAV, MP3, or M4A audio.");
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="card audio-card" aria-labelledby="audio-title">
      <div>
        <p className="eyebrow">Local sensor lab</p>
        <h2 id="audio-title">Try a footstep recording</h2>
        <p className="muted">
          Select locally recorded audio. The browser derives timing and relative impact energy,
          then immediately releases the raw recording.
        </p>
      </div>
      <div className="audio-actions">
        <label className="secondary-button" aria-busy={status === "working"}>
          {status === "working" ? "Analyzing locally…" : "Choose local audio"}
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            disabled={status === "working"}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </label>
        <span className="privacy-inline"><span className="privacy-dot" />No upload</span>
      </div>
      {message && <p className={`audio-message ${status === "error" ? "error" : ""}`} role="status">{message}</p>}
      {result && (
        <div className="audio-results">
          <div><span>Duration</span><strong>{result.durationSec}s</strong></div>
          <div><span>Candidate steps</span><strong>{features?.stepCount ?? 0}</strong></div>
          <div><span>Derived cadence</span><strong>{features?.cadenceSpm ?? "—"}</strong></div>
          <div><span>Raw audio retained</span><strong>No</strong></div>
        </div>
      )}
    </section>
  );
}
