# Kamai — muestra de dashboard

Muestra conceptual de cómo se vería el dashboard de Kamai en un móvil, construida con React + Vite. Muestra los tres casos discutidos en el caso de estudio (Inés Huamán) más dos perfiles sintéticos para contrastar (Estefanía con medición manual, Viviana con facturas reales).

## Levantar con un comando

```bash
docker compose up -d
```

La app queda servida en **http://localhost:3210**. La primera vez tarda unos segundos en construir la imagen de Docker (instala `node_modules` adentro del contenedor, no hace falta nada en la máquina host).

Para detenerla:

```bash
docker compose down
```

## Estructura

```
sample/
├── docker-compose.yml       # un solo servicio, expone 3210
├── Dockerfile               # build de Vite + nginx
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── App.jsx              # selector de persona + phone frame
    ├── main.jsx
    ├── index.css
    ├── App.css
    └── components/
        ├── PersonaSelector.jsx
        ├── PhoneFrame.jsx           # marco visual del móvil
        ├── common/ConsumptionChart.jsx
        └── dashboards/
            ├── dashboard.css        # estilos compartidos
            ├── DashboardNav.jsx
            ├── Estefania.jsx        # Caso 1: medición manual
            ├── Viviana.jsx          # Caso 2: facturas reales
            └── Ines.jsx             # Caso 3: plan trabado, Case B
```

## Los tres casos

- **Estefanía (7 meses, medición manual)** — Chart con badge verde "Medición proyectada" + tooltip al hover que explica que su línea base viene de 12 días de medición propia.
- **Viviana (11 meses, facturas reales)** — Dashboard base, sin badges ni aclaraciones. Muestra ahorro real en kWh y Soles.
- **Inés Huamán (7 semanas sin avanzar)** — Mensaje de Case B: puede continuar con su plan actual o re-evaluar opciones. La aclaración explica que se le ofrece re-evaluar porque todavía no gastó dinero en "Aislamiento térmico del horno".

## Personalizar

Los datos de cada persona están hardcodeados en su componente `dashboards/<Persona>.jsx`. Para cambiar cifras, basta editar el array de meses y los valores de referencia.
