export type DonutSegment = { label: string; value: number; color: string };

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}

export default function DonutChart({ segments, size = 160, thickness = 24 }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total <= 0) {
    return <div className="empty-state">No hay datos suficientes todavía.</div>;
  }

  let offset = 0;

  return (
    <div className="donut-chart-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-chart">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={thickness} />
        {segments.map((s) => {
          const fraction = s.value / total;
          const dash = fraction * circumference;
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <ul className="chart-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">{s.label}</span>
            <span className="legend-value">{s.value.toFixed(2)} €</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
