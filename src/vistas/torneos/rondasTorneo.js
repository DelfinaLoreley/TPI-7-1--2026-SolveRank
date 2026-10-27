export function normalizarNombre(valor) {
    return String(valor || '').trim().toLocaleLowerCase('es');
}

export function formatearTiempoRonda(valor) {
    if (!valor) return '—';
    const coincidencia = String(valor).match(/^(\d{1,3}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (!coincidencia) return String(valor);

    const [, horas, minutos, segundos, fraccion = ''] = coincidencia;
    const minutosTotales = Number(horas) * 60 + Number(minutos);
    const centesimas = fraccion.slice(0, 2).padEnd(2, '0');
    const tiempo = `${String(Number(segundos)).padStart(2, '0')}.${centesimas}`;
    return minutosTotales > 0 ? `${String(minutosTotales).padStart(2, '0')}:${tiempo}` : tiempo;
}

export function cutoffConfigurado(valor) {
    if (!valor) return false;
    return !/^0{1,3}:00:00(?:\.0+)?$/.test(String(valor));
}

export function avanceLegible(ronda) {
    if (normalizarNombre(ronda.nombre).includes('final')) return '—';
    const porcentaje = Number(ronda.porcentajeAvance);
    return Number.isFinite(porcentaje) && porcentaje > 0 ? `${porcentaje}% mejor` : '—';
}
