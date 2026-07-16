import { useMemo, useState } from "react";
import { LocalAudioPanel } from "./components/LocalAudioPanel";
import { TrendChart } from "./components/TrendChart";
import { requestGptSummary } from "./lib/api";
import { assessGaitChange } from "./lib/assessment";
import { establishBaseline } from "./lib/baseline";
import { deriveFeatures } from "./lib/features";
import { createReliabilityCase, getScenario, scenarios } from "./lib/scenarios";
import { makeOfflineSummary, type GptSummary } from "./lib/summary";
import type { MetricKey, Observation, Scenario } from "./types";

type ReliabilityCase = "none" | "unknown-occupant" | "low-confidence" | "missing-sensors";

const STATE_LABELS = {
  stable: "Within personal range",
  "isolated-anomaly": "Temporary variation",
  "sustained-change": "Sustained change",
  "insufficient-data": "More evidence needed",
  "low-confidence": "Low confidence",
  "unknown-occupant": "Occupant unconfirmed",
} as const;

const METRICS: Array<{ key: MetricKey; label: string; unit: string; shortUnit: string }> = [
  { key: "cadenceSpm", label: "Cadence", unit: "steps per minute", shortUnit: "steps/min" },
  {
    key: "stepIntervalVariabilityPct",
    label: "Timing variability",
    unit: "coefficient of variation",
    shortUnit: "% CV",
  },
  {
    key: "impactEnergyMedian",
    label: "Impact energy",
    unit: "relative energy units",
    shortUnit: "relative",
  },
  {
    key: "transitionDurationSec",
    label: "Room transition",
    unit: "seconds",
    shortUnit: "sec",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function App() {
  const [scenarioId, setScenarioId] = useState<Scenario["id"]>("sustained");
  const [reliabilityCase, setReliabilityCase] = useState<ReliabilityCase>("none");
  const [chartMetric, setChartMetric] = useState<MetricKey>("cadenceSpm");
  const [summarySource, setSummarySource] = useState<"offline" | "gpt">("offline");
  const [gptStatus, setGptStatus] = useState<"idle" | "working" | "error">("idle");
  const [gptError, setGptError] = useState("");
  const [gptSummary, setGptSummary] = useState<GptSummary | null>(null);

  const scenario = getScenario(scenarioId);
  const observations: Observation[] = useMemo(
    () =>
      reliabilityCase === "none"
        ? scenario.observations
        : createReliabilityCase(reliabilityCase),
    [scenario, reliabilityCase],
  );
  const features = useMemo(() => observations.map(deriveFeatures), [observations]);
  const baseline = useMemo(
    () => establishBaseline(observations, features),
    [observations, features],
  );
  const assessment = useMemo(
    () => assessGaitChange(observations, features, baseline),
    [observations, features, baseline],
  );
  const offlineSummary = useMemo(() => makeOfflineSummary(assessment), [assessment]);
  const summary = summarySource === "gpt" && gptSummary ? gptSummary : offlineSummary;
  const latest = features.at(-1)!;
  const activeMetric = METRICS.find((metric) => metric.key === chartMetric)!;

  function selectScenario(id: Scenario["id"]) {
    setScenarioId(id);
    setReliabilityCase("none");
    setSummarySource("offline");
    setGptSummary(null);
    setGptError("");
  }

  async function generateWithGpt() {
    setGptStatus("working");
    setGptError("");
    try {
      const generated = await requestGptSummary({ assessment, baseline, features });
      setGptSummary(generated);
      setSummarySource("gpt");
      setGptStatus("idle");
    } catch (error) {
      setSummarySource("offline");
      setGptStatus("error");
      setGptError(error instanceof Error ? error.message : "GPT was unavailable.");
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Custos</strong><small>Gait Awareness</small></span>
        </a>
        <div className="header-meta">
          <span className="research-badge">Research prototype</span>
          <span className="privacy-chip"><span className="privacy-dot" />Raw audio stays local</span>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">A future direction for Custos Hub by Rockwell</p>
            <h1>Notice the pattern.<br /><em>Respect the person.</em></h1>
            <p className="hero-text">
              A privacy-first demonstration of how ambient footstep, motion, and room-transition
              evidence could surface sustained changes from an older adult’s own gait baseline.
            </p>
          </div>
          <aside className="boundary-card" aria-label="Prototype boundary">
            <span>What this does</span>
            <strong>Describes change over time</strong>
            <p>It supports activity awareness and human safety consultation. It does not produce a medical conclusion.</p>
          </aside>
        </section>

        <section className="scenario-section" aria-labelledby="scenario-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Instant judge demos</p>
              <h2 id="scenario-heading">Choose an evidence story</h2>
            </div>
            <p>Each scenario uses clearly labeled synthetic footfalls and simulated ambient events.</p>
          </div>
          <div className="scenario-grid" role="group" aria-label="Demonstration scenarios">
            {scenarios.map((item, index) => (
              <button
                key={item.id}
                className={`scenario-button ${scenarioId === item.id && reliabilityCase === "none" ? "active" : ""}`}
                aria-pressed={scenarioId === item.id && reliabilityCase === "none"}
                onClick={() => selectScenario(item.id)}
              >
                <span className="scenario-index">0{index + 1}</span>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={`status-panel state-${assessment.state}`} aria-live="polite">
          <div className="status-symbol" aria-hidden="true"><span /></div>
          <div className="status-copy">
            <div className="status-kicker">
              <span>{STATE_LABELS[assessment.state]}</span>
              <span>{Math.round(assessment.confidence * 100)}% evidence confidence</span>
            </div>
            <h2>{summary.headline}</h2>
            <p>{summary.summary}</p>
          </div>
          <div className="summary-source">
            <span>Summary source</span>
            <strong>{summarySource === "gpt" ? "GPT‑5.6 · validated" : "Offline · deterministic"}</strong>
            <button className="primary-button" onClick={() => void generateWithGpt()} disabled={gptStatus === "working"}>
              {gptStatus === "working" ? "Interpreting…" : "Interpret with GPT‑5.6"}
            </button>
          </div>
        </section>
        {gptError && <p className="api-notice" role="status">{gptError} Offline evidence remains active.</p>}

        <section className="metric-grid" aria-label="Current gait measures">
          {METRICS.map((metric) => {
            const current = metric.key === "impactEnergyMedian" ? latest.impactEnergy?.median : latest[metric.key];
            const base = baseline.metrics[metric.key]?.mean;
            const change = assessment.changedFeatures.find((item) => item.metric === metric.key);
            return (
              <article key={metric.key} className="metric-card">
                <div><span>{metric.label}</span><i className="provenance-tag derived">Derived</i></div>
                <strong>{current ?? "—"}<small>{metric.shortUnit}</small></strong>
                <p>Baseline {base ?? "—"} {metric.shortUnit}</p>
                <span className={change?.exceedsThreshold ? "metric-change changed" : "metric-change"}>
                  {change?.exceedsThreshold ? `${Math.abs(change.percentChange)}% ${change.direction}` : "Inside personal range"}
                </span>
              </article>
            );
          })}
        </section>

        <section className="dashboard-grid">
          <div className="card chart-card">
            <div className="metric-tabs" role="tablist" aria-label="Trend metric">
              {METRICS.map((metric) => (
                <button
                  key={metric.key}
                  role="tab"
                  aria-selected={chartMetric === metric.key}
                  className={chartMetric === metric.key ? "active" : ""}
                  onClick={() => setChartMetric(metric.key)}
                >
                  {metric.label}
                </button>
              ))}
            </div>
            <TrendChart
              features={features}
              baseline={baseline}
              metric={chartMetric}
              label={activeMetric.label}
              unit={activeMetric.unit}
            />
          </div>

          <aside className="card followup-card" aria-labelledby="followup-title">
            <p className="eyebrow">Human follow-up</p>
            <h2 id="followup-title">{summary.nextStep}</h2>
            <div className="evidence-list">
              {summary.evidence.length > 0 ? summary.evidence.map((item) => (
                <div key={item.metric}>
                  <span>{METRICS.find((metric) => metric.key === item.metric)?.label}</span>
                  <strong>{item.baselineValue} → {item.observedValue}</strong>
                  <small>{item.unit}</small>
                </div>
              )) : <p>No measurement crossed the sustained-change threshold.</p>}
            </div>
            <div className="uncertainty-box">
              <strong>Keep in context</strong>
              <ul>{summary.uncertainty.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </aside>
        </section>

        <section className="card observations-card" aria-labelledby="observations-title">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Evidence ledger</p>
              <h2 id="observations-title">What was observed and what was derived</h2>
            </div>
            <div className="provenance-legend">
              <span><i className="provenance-tag synthetic">Synthetic</i> footfalls</span>
              <span><i className="provenance-tag simulated">Simulated</i> ambient</span>
              <span><i className="provenance-tag derived">Derived</i> metrics</span>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Observation</th><th>Cadence</th><th>Variability</th><th>Impact median</th><th>Transition</th><th>Confidence</th><th>Sensors</th></tr></thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={feature.observationId}>
                    <td><strong>{observations[index].label}</strong><span>{formatDate(feature.capturedAt)}</span></td>
                    <td>{feature.cadenceSpm ?? "—"}</td>
                    <td>{feature.stepIntervalVariabilityPct ?? "—"}%</td>
                    <td>{feature.impactEnergy?.median ?? "—"}</td>
                    <td>{feature.transitionDurationSec ?? "—"}s</td>
                    <td><span className="confidence-cell"><i style={{ width: `${feature.sensorConfidence * 100}%` }} />{Math.round(feature.sensorConfidence * 100)}%</span></td>
                    <td>{feature.availableSensors.length} active{feature.missingSensors.length > 0 && <small>{feature.missingSensors.join(", ")} unavailable</small>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="privacy-grid">
          <article className="privacy-feature">
            <div className="privacy-visual" aria-hidden="true"><span className="house"><i /><b /></span><span className="local-ring" /></div>
            <div>
              <p className="eyebrow">Privacy by architecture</p>
              <h2>Audio becomes measurements before it leaves the room.</h2>
              <p>Raw audio is decoded in memory, reduced to footfall timestamps and relative energy, and released. Only structured derived evidence can reach GPT‑5.6.</p>
            </div>
          </article>
          <div className="privacy-rules">
            <div><span>01</span><strong>Local processing</strong><p>Browser-only audio analysis</p></div>
            <div><span>02</span><strong>Minimal evidence</strong><p>Timing, energy, confidence</p></div>
            <div><span>03</span><strong>No identity claim</strong><p>Unconfirmed occupants excluded</p></div>
            <div><span>04</span><strong>No raw retention</strong><p>Audio discarded after derivation</p></div>
          </div>
        </section>

        <LocalAudioPanel />

        <section className="card reliability-card" aria-labelledby="reliability-title">
          <div>
            <p className="eyebrow">Graceful edge cases</p>
            <h2 id="reliability-title">Pressure-test the evidence gate</h2>
            <p className="muted">These controls demonstrate that uncertainty changes the output instead of being hidden.</p>
          </div>
          <div className="reliability-controls">
            <button onClick={() => setReliabilityCase("unknown-occupant")}>Unknown occupant</button>
            <button onClick={() => setReliabilityCase("low-confidence")}>Noisy evidence</button>
            <button onClick={() => setReliabilityCase("missing-sensors")}>Missing sensors</button>
            <button className="reset" onClick={() => setReliabilityCase("none")}>Reset scenario</button>
          </div>
        </section>

        <section className="boundary-footer">
          <div><span className="brand-mark small" aria-hidden="true"><i /><i /><i /></span><strong>Custos Gait Awareness</strong></div>
          <p>Research prototype associated with a future direction for Custos Hub by Rockwell. Built for OpenAI Build Week 2026.</p>
        </section>
      </main>
    </>
  );
}
