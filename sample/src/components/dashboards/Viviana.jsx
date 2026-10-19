import ConsumptionChart from '../common/ConsumptionChart.jsx';
import DashboardNav from './DashboardNav.jsx';
import './dashboard.css';

// Synthetic but consistent with an 11-month history after a MEDIA/BAJA EI (LED).
// LED has a smaller per-month delta than refrigeration work; ~14% is plausible.
const VIVIANA_DATA = [
  { month: 'Ago', kWh: 2100, season: 'normal' },
  { month: 'Sep', kWh: 2080, season: 'normal' },
  { month: 'Oct', kWh: 2050, season: 'normal' },
  { month: 'Nov', kWh: 2030, season: 'normal' },
  { month: 'Dic', kWh: 1990, season: 'summer' },
  { month: 'Ene', kWh: 1970, season: 'summer' },
  { month: 'Feb', kWh: 1960, season: 'summer' },
  { month: 'Mar', kWh: 1940, season: 'summer' },
  { month: 'Abr', kWh: 1920, season: 'normal' },
  { month: 'May', kWh: 1900, season: 'normal' },
  { month: 'Jun', kWh: 1880, season: 'normal' },
];

const BASELINE_KWH = 2200;
const AVG_MONTHLY_KWH = VIVIANA_DATA.reduce((s, d) => s + d.kWh, 0) / VIVIANA_DATA.length;
const SAVINGS_PCT = Math.round(((BASELINE_KWH - AVG_MONTHLY_KWH) / BASELINE_KWH) * 100);
const MONTHLY_SAVINGS_KWH = Math.round(BASELINE_KWH - AVG_MONTHLY_KWH);
const TARIFF_START = 0.75;
const TARIFF_NOW = 0.81;
const TARIFF_DELTA_PCT = Math.round(((TARIFF_NOW - TARIFF_START) / TARIFF_START) * 100);
const MONTHLY_SAVINGS_SOLES = Math.round(MONTHLY_SAVINGS_KWH * TARIFF_NOW);

export default function VivianaDashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-scroll">
        <div className="dashboard-greeting">
          <div className="dashboard-avatar">V</div>
          <div>
            <h2>Hola, Viviana</h2>
            <p>Taller Mecánico V&amp;V · La Paz, Bolivia</p>
          </div>
        </div>

        <div className="card card-hero">
          <p className="hero-eyebrow">Ahorro desde tu primera ecoinnovación</p>
          <p className="hero-value">−{SAVINGS_PCT}%</p>
          <p className="hero-subtext">
            Ahorrás aprox. S/ {MONTHLY_SAVINGS_SOLES} por mes · {MONTHLY_SAVINGS_KWH} kWh menos
            por mes desde que empezaste.
          </p>
          <p className="hero-subtext" style={{ marginTop: 8, fontSize: 11.5, opacity: 0.85 }}>
            Tarifa: S/ {TARIFF_START.toFixed(2)} → S/ {TARIFF_NOW.toFixed(2)} por kWh
            (+{TARIFF_DELTA_PCT}% en este período). El ahorro en soles ya contempla este cambio.
          </p>
        </div>

        <div className="card">
          <ConsumptionChart
            data={VIVIANA_DATA}
            baseline={BASELINE_KWH}
            baselineLabel="Promedio antes de tu ecoinnovación"
          />
        </div>

        <div className="card">
          <div className="plan-status">
            <span className="status-pill completed">
              <span className="pill-dot" />
              Completado
            </span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>11 meses en marcha</span>
          </div>
          <h3 className="card-title">Iluminación LED en taller y oficina</h3>
          <p className="plan-meta">
            <strong>Inversión:</strong> MEDIA · <strong>Complejidad:</strong> BAJA ·{' '}
            <strong>Categoría:</strong> Energía
          </p>
          <div className="next-step">
            <strong>Próximo paso</strong>
            Tu plan ya está completo. Si querés, podés explorar la siguiente ecoinnovación
            recomendada para tu perfil.
          </div>
        </div>
      </div>
      <DashboardNav active="home" />
    </div>
  );
}
