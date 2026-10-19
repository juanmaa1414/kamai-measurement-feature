export default function DashboardNav({ active = 'home' }) {
  const items = [
    { id: 'home', label: 'Inicio', icon: '⌂' },
    { id: 'plan', label: 'Plan', icon: '✓' },
    { id: 'bills', label: 'Facturas', icon: '◧' },
    { id: 'profile', label: 'Perfil', icon: '☺' },
  ];

  return (
    <nav className="dashboard-nav" aria-label="Navegación principal">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${active === item.id ? 'active' : ''}`}
          aria-current={active === item.id ? 'page' : undefined}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
