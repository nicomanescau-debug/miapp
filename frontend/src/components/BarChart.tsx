export type ChartBar = { label: string; value: number; color: string };

interface BarChartProps {
  bars: ChartBar[];
  height?: number;
}

export default function BarChart({ bars, height = 140 }: BarChartProps) {
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.value)));

  return (
    <div className="bar-chart" style={{ height }}>
      {bars.map((b) => (
        <div key={b.label} className="bar-col">
          <div className="bar-value">{b.value.toFixed(2)} €</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ height: `${(Math.abs(b.value) / max) * 100}%`, background: b.color }}
            />
          </div>
          <div className="bar-label">{b.label}</div>
        </div>
      ))}
    </div>
  );
}
