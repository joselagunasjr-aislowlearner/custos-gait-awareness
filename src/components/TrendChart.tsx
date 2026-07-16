import type { GaitBaseline, GaitFeatures, MetricKey } from "../types";

interface TrendChartProps {
  features: GaitFeatures[];
  baseline: GaitBaseline;
  metric: MetricKey;
  label: string;
  unit: string;
}

function valueFor(feature: GaitFeatures, metric: MetricKey): number | null {
  return metric === "impactEnergyMedian"
    ? feature.impactEnergy?.median ?? null
    : feature[metric];
}

export function TrendChart({
  features,
  baseline,
  metric,
  label,
  unit,
}: TrendChartProps) {
  const values = features
    .map((feature) => valueFor(feature, metric))
    .filter((value): value is number => value !== null);
  const baselineMetric = baseline.metrics[metric];
  const allValues = baselineMetric ? [...values, baselineMetric.mean] : values;
  const minimum = Math.min(...allValues);
  const maximum = Math.max(...allValues);
  const padding = Math.max((maximum - minimum) * 0.25, Math.abs(maximum) * 0.04, 0.5);
  const yMin = minimum - padding;
  const yMax = maximum + padding;
  const width = 760;
  const height = 240;
  const inset = { top: 22, right: 22, bottom: 40, left: 55 };
  const x = (index: number) =>
    inset.left + (index / Math.max(1, features.length - 1)) * (width - inset.left - inset.right);
  const y = (value: number) =>
    inset.top + ((yMax - value) / Math.max(0.001, yMax - yMin)) * (height - inset.top - inset.bottom);
  const points = features
    .map((feature, index) => {
      const value = valueFor(feature, metric);
      return value === null ? null : { x: x(index), y: y(value), value, feature, index };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const band = baselineMetric
    ? Math.max(baselineMetric.standardDeviation * 2.5, baselineMetric.mean * 0.05)
    : 0;
  const bandTop = baselineMetric ? y(baselineMetric.mean + band) : 0;
  const bandBottom = baselineMetric ? y(baselineMetric.mean - band) : 0;

  return (
    <figure className="trend-figure" aria-labelledby="trend-title">
      <div className="chart-heading">
        <div>
          <p className="eyebrow">Longitudinal evidence</p>
          <h2 id="trend-title">{label} over time</h2>
        </div>
        <div className="chart-legend" aria-label="Chart legend">
          <span><i className="legend-line" />Observation</span>
          <span><i className="legend-band" />Personal range</span>
        </div>
      </div>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label} trend. ${features.length} observations, measured in ${unit}.`}
      >
        {[0, 0.5, 1].map((fraction) => {
          const value = yMax - (yMax - yMin) * fraction;
          const lineY = y(value);
          return (
            <g key={fraction}>
              <line x1={inset.left} x2={width - inset.right} y1={lineY} y2={lineY} className="grid-line" />
              <text x={inset.left - 10} y={lineY + 4} textAnchor="end" className="axis-label">
                {value.toFixed(metric === "impactEnergyMedian" ? 2 : 1)}
              </text>
            </g>
          );
        })}
        {baselineMetric && (
          <>
            <rect
              x={inset.left}
              y={Math.min(bandTop, bandBottom)}
              width={width - inset.left - inset.right}
              height={Math.abs(bandBottom - bandTop)}
              className="baseline-band"
            />
            <line
              x1={inset.left}
              x2={width - inset.right}
              y1={y(baselineMetric.mean)}
              y2={y(baselineMetric.mean)}
              className="baseline-line"
            />
          </>
        )}
        <path d={path} className="trend-path" />
        {points.map((point) => (
          <g key={point.feature.observationId}>
            <circle
              cx={point.x}
              cy={point.y}
              r={baseline.observationIds.includes(point.feature.observationId) ? 4.5 : 6}
              className={baseline.observationIds.includes(point.feature.observationId) ? "point baseline-point" : "point followup-point"}
            />
            <title>{`${point.feature.observationId}: ${point.value} ${unit}`}</title>
          </g>
        ))}
        {features.map((feature, index) => (
          <text key={feature.observationId} x={x(index)} y={height - 14} textAnchor="middle" className="x-label">
            {index < 5 ? `B${index + 1}` : `F${index - 4}`}
          </text>
        ))}
      </svg>
      <figcaption>
        B1–B5 establish the individual baseline. F1–F3 are the comparison window.
      </figcaption>
    </figure>
  );
}
