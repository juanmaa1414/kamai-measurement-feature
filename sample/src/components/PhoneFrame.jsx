import './PhoneFrame.css';

export default function PhoneFrame({ children }) {
  return (
    <div className="phone-stage" aria-label="Vista previa del dashboard en un móvil">
      <div className="phone">
        <div className="phone-notch" />
        <div className="phone-screen">{children}</div>
        <div className="phone-home-indicator" />
      </div>
      <p className="phone-caption">Concepto de visualización en móvil (375 × 720 px)</p>
    </div>
  );
}
