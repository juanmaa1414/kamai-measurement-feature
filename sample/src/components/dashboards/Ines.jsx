import { useState } from 'react';
import ConsumptionChart from '../common/ConsumptionChart.jsx';
import DashboardNav from './DashboardNav.jsx';
import './dashboard.css';

// Real data from the case study (Pruebas tecnicas.pdf, p. 2).
// Perú: Dec-Mar is summer.
const INES_BILLS = [
  { month: 'Ene', kWh: 1840, tariff: 0.78, season: 'summer' },
  { month: 'Feb', kWh: 1690, tariff: 0.78, season: 'summer', days: 28 },
  { month: 'Mar', kWh: 1910, tariff: 0.81, season: 'summer' },
  { month: 'Abr', kWh: 1760, tariff: 0.81, season: 'normal' },
  { month: 'May', kWh: 1880, tariff: 0.81, season: 'normal' },
  { month: 'Jun', kWh: 1720, tariff: 0.84, season: 'normal' },
];

export default function InesDashboard() {
  const [swapAcknowledged, setSwapAcknowledged] = useState(false);

  return (
    <div className="dashboard">
      <div className="dashboard-scroll">
        <div className="dashboard-greeting">
          <div className="dashboard-avatar">I</div>
          <div>
            <h2>Hola, Inés</h2>
            <p>Panadería Santa Inés · Arequipa, Perú</p>
          </div>
        </div>

        <div className="card card-hero warning">
          <p className="hero-eyebrow">Tu plan necesita decisión</p>
          <p className="hero-value" style={{ fontSize: 22 }}>
            No avanzaste con tu plan
          </p>
          <p className="hero-subtext">
            Elegiste <em>Aislamiento térmico del horno</em> hace 7 semanas y todavía no
            iniciaste ningún paso. Podés continuarlo o, si querés, re-evaluar otras opciones
            que quizá se ajusten mejor a tu tiempo y presupuesto de este trimestre.
          </p>
        </div>

        <div className="card">
          <ConsumptionChart
            data={INES_BILLS}
            baseline={null}
            noBaselineMessage="Aún no completaste una ecoinnovación, así que todavía no hay línea base con la que comparar."
          />
        </div>

        <div className="card">
          <div className="plan-status">
            <span className="status-pill stalled">
              <span className="pill-dot" />
              Sin avances · 7 semanas
            </span>
          </div>
          <h3 className="card-title">Aislamiento térmico del horno</h3>
          <p className="plan-meta">
            <strong>Inversión:</strong> ALTA · <strong>Complejidad:</strong> ALTA ·{' '}
            <strong>Categoría:</strong> Energía
          </p>
          <div className="next-step">
            <strong>Tu plan actual</strong>
            Paso 1: <em>Cotizar aislamiento</em> — todavía no iniciado.
          </div>
        </div>

        {!swapAcknowledged ? (
          <div className="action-row">
            <button type="button" className="btn btn-secondary" onClick={() => setSwapAcknowledged(true)}>
              Continuar con este plan
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setSwapAcknowledged(true)}>
              Re-evaluar opciones de ecoinnovación
            </button>
          </div>
        ) : (
          <div className="card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
            <h3 className="card-title" style={{ color: '#1e3a8a' }}>
              Entendido — continuemos
            </h3>
            <p className="plan-meta" style={{ color: '#1e40af' }}>
              Te enviaremos un recordatorio en 14 días. Si querés volver a re-evaluar,
              podés hacerlo desde la pantalla del plan.
            </p>
          </div>
        )}
      </div>
      <DashboardNav active="home" />
    </div>
  );
}
