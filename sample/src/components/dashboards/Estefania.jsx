import ConsumptionChart from '../common/ConsumptionChart.jsx';
import DashboardNav from './DashboardNav.jsx';
import './dashboard.css';

const PROJECTION_NOTE =
  'Tu consumo mensual promedio _antes_ de tus ecoinnovaciones es calculado en base a lo que mediste tú durante 12 días.';

// Synthetic but consistent with a 7-month history after a BAJA/BAJA EI.
const ESTEFANIA_DATA = [
  { month: 'Dic', kWh: 1430, season: 'summer' },
  { month: 'Ene', kWh: 1410, season: 'summer' },
  { month: 'Feb', kWh: 1390, season: 'summer' },
  { month: 'Mar', kWh: 1380, season: 'summer' },
  { month: 'Abr', kWh: 1360, season: 'normal' },
  { month: 'May', kWh: 1340, season: 'normal' },
  { month: 'Jun', kWh: 1330, season: 'normal' },
];

const BASELINE_KWH = 1860;
const AVG_MONTHLY_KWH = ESTEFANIA_DATA.reduce((s, d) => s + d.kWh, 0) / ESTEFANIA_DATA.length;
const SAVINGS_PCT = Math.round(((BASELINE_KWH - AVG_MONTHLY_KWH) / BASELINE_KWH) * 100);
const MONTHLY_SAVINGS_KWH = Math.round(BASELINE_KWH - AVG_MONTHLY_KWH);
const TARIFF_START = 0.78;
const TARIFF_NOW = 0.84;
const TARIFF_DELTA_PCT = Math.round(((TARIFF_NOW - TARIFF_START) / TARIFF_START) * 100);
const MONTHLY_SAVINGS_SOLES = Math.round(MONTHLY_SAVINGS_KWH * TARIFF_NOW);

export default function EstefaniaDashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-scroll">
        <div className="dashboard-greeting">
          <div className="dashboard-avatar">E</div>
          <div>
            <h2>Hola, Estefanía</h2>
            <p>Restaurante Doña Efi · Arequipa, Perú</p>
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
            (+{TARIFF_DELTA_PCT}% en este período). Como empezaste con medición manual, el cálculo
            en soles usa la tarifa actual como referencia.
          </p>
        </div>

        <div className="card">
          <ConsumptionChart
            data={ESTEFANIA_DATA}
            baseline={BASELINE_KWH}
            showProjectionBadge
            projectionNote={PROJECTION_NOTE}
            baselineLabel="Línea base (proyectada)"
          />
        </div>

        <div className="card">
          <div className="plan-status">
            <span className="status-pill completed">
              <span className="pill-dot" />
              Completado
            </span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>7 meses en marcha</span>
          </div>
          <h3 className="card-title">Mantenimiento de burletes y descongelamiento</h3>
          <p className="plan-meta">
            <strong>Inversión:</strong> BAJA · <strong>Complejidad:</strong> BAJA ·{' '}
            <strong>Categoría:</strong> Energía
          </p>
          <div className="next-step">
            <strong>Próximo paso</strong>
            Repetir el mantenimiento cada 3 meses para mantener el ahorro. Registrá una
            nueva foto de tu medidor si querés actualizar la línea base.
          </div>
        </div>
      </div>
      <DashboardNav active="home" />
    </div>
  );
}
