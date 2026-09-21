const ROTULO = {
  alto: 'Risco alto',
  medio: 'Risco médio',
  baixo: 'Risco baixo',
};

// Etiqueta com cor E texto (a cor sozinha não basta: nem todo mundo distingue).
export default function EtiquetaRisco({ risco }) {
  return <span className={`etiqueta-risco risco-${risco.nivel}`}>{ROTULO[risco.nivel]}</span>;
}
