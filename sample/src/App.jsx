import { useState } from 'react';
import './App.css';
import PersonaSelector from './components/PersonaSelector.jsx';
import PhoneFrame from './components/PhoneFrame.jsx';
import EstefaniaDashboard from './components/dashboards/Estefania.jsx';
import VivianaDashboard from './components/dashboards/Viviana.jsx';
import InesDashboard from './components/dashboards/Ines.jsx';

const PERSONAS = {
  estefania: {
    id: 'estefania',
    label: 'Caso 1 — Estefanía',
    reference:
      'Estefanía lleva 7 meses con una ecoinnovación. Como empezó sin facturas, hizo una medición manual de 12 días con su medidor. Por eso su chart muestra un badge verde "Medición proyectada" y, al pasar el mouse, una nota explica cómo se calculó su línea base.',
    component: EstefaniaDashboard,
  },
  viviana: {
    id: 'viviana',
    label: 'Caso 2 — Viviana',
    reference:
      'Viviana lleva 11 meses con su ecoinnovación y ya tiene facturas reales de su negocio. Su dashboard es el caso base: sin aclaraciones ni badges especiales.',
    component: VivianaDashboard,
  },
  ines: {
    id: 'ines',
    label: 'Caso 3 — Inés Huamán',
    reference:
      'Inés eligió "Aislamiento térmico del horno" pero lleva 7 semanas sin avanzar. Como aún no gastó dinero en implementarlo, el sistema le ofrece re-evaluar otras opciones además de continuar con su plan actual.',
    component: InesDashboard,
  },
};

export default function App() {
  const [selected, setSelected] = useState('estefania');
  const persona = PERSONAS[selected];
  const DashboardComponent = persona.component;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>Muestra — Dashboard Kamai</h1>
          <p className="app-subtitle">
            Vista conceptual de la app en un móvil. Elegí un caso para ver cómo
            se comporta el dashboard después de las mejoras.
          </p>
        </div>
        <PersonaSelector
          personas={Object.values(PERSONAS)}
          selected={selected}
          onChange={setSelected}
          reference={persona.reference}
        />
      </header>
      <main className="app-main">
        <PhoneFrame>
          <DashboardComponent />
        </PhoneFrame>
      </main>
    </div>
  );
}
