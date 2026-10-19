export default function PersonaSelector({ personas, selected, onChange, reference }) {
  return (
    <div className="persona-selector">
      <div className="persona-options" role="radiogroup" aria-label="Casos de muestra">
        {personas.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected === p.id}
            className={`persona-option ${selected === p.id ? 'selected' : ''}`}
            onClick={() => onChange(p.id)}
          >
            <span className="dot" />
            {p.label}
          </button>
        ))}
      </div>
      <p className="persona-reference">{reference}</p>
    </div>
  );
}
