import { useState } from 'react';
import './ConsumptionChart.css';

export default function ConsumptionChart({
  data,
  baseline = null,
  baselineLabel = 'Promedio antes de tu ecoinnovación',
  showProjectionBadge = false,
  projectionNote = '',
  yAxisLabel = 'kWh por mes',
  noBaselineMessage = null,
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const width = 320;
  const height = 180;
  const padX = 28;
  const padY = 22;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const allValues = baseline != null
    ? [...data.map((d) => d.kWh), baseline]
    : data.map((d) => d.kWh);
  const maxValue = Math.max(...allValues);
  const minValue = 0;
  const yScale = (v) => padY + innerH - ((v - minValue) / (maxValue - minValue)) * innerH;
  const xScale = (i) => padX + (i * innerW) / Math.max(data.length - 1, 1);
  const barWidth = innerW / data.length / 1.6;

  const baselineY = baseline != null ? yScale(baseline) : null;

  return (
    <div className="consumption-chart">
      <div className="chart-header">
        <div>
          <h4>Consumo mensual</h4>
          <p className="chart-subtitle">Comparado con tu línea base</p>
        </div>
        {showProjectionBadge && (
          <div
            className="projection-badge-wrapper"
            onMouseEnter={() => setTooltipOpen(true)}
            onMouseLeave={() => setTooltipOpen(false)}
            onFocus={() => setTooltipOpen(true)}
            onBlur={() => setTooltipOpen(false)}
            tabIndex={0}
            role="note"
            aria-label="Medición proyectada. Pasa el cursor para más información."
          >
            <span className="projection-badge">
              <span className="projection-dot" />
              Medición proyectada
            </span>
            {tooltipOpen && (
              <div className="projection-tooltip" role="tooltip">
                {projectionNote}
              </div>
            )}
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="Gráfico de consumo mensual en kWh">
        {baselineY != null && (
          <>
            <line
              x1={padX}
              x2={width - padX}
              y1={baselineY}
              y2={baselineY}
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text x={width - padX} y={baselineY - 6} className="chart-baseline-label" textAnchor="end">
              {baselineLabel}: {Math.round(baseline).toLocaleString('es-PE')} kWh
            </text>
          </>
        )}

        {data.map((d, i) => {
          const x = xScale(i) - barWidth / 2;
          const y = yScale(d.kWh);
          const h = padY + innerH - y;
          const fill = d.season === 'summer' ? '#fde68a' : '#bfdbfe';
          const stroke = d.season === 'summer' ? '#f59e0b' : '#2563eb';
          return (
            <g key={d.month}>
              <rect x={x} y={y} width={barWidth} height={h} fill={fill} stroke={stroke} strokeWidth="1" rx="3" />
              <text x={xScale(i)} y={height - 4} className="chart-x-label" textAnchor="middle">
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="chart-footnote">
        {noBaselineMessage
          ? noBaselineMessage
          : `${yAxisLabel} · barras amarillas = meses de verano`}
      </p>
    </div>
  );
}
