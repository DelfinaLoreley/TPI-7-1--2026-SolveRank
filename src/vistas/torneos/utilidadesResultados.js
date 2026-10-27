export function centesimas(tiempo) {
    if (['DNF', 'DNS'].includes(String(tiempo || '').trim().toUpperCase())) return null;
    const coincidencia = String(tiempo || '').trim().match(/^(?:(\d{1,5}):)?([0-5]?\d)\.(\d{2})(\+2)?$/i);
    if (!coincidencia) return null;
    return ((Number(coincidencia[1] || 0) * 60 + Number(coincidencia[2])) * 100)
        + Number(coincidencia[3]) + (coincidencia[4] ? 200 : 0);
}

export function tiempoLegible(valor) {
    if (!Number.isFinite(valor)) return 'DNF';
    const minutos = Math.floor(valor / 6000);
    const segundos = Math.floor((valor % 6000) / 100);
    const parteCentesimas = Math.trunc(valor % 100);
    const parteSegundos = `${String(segundos).padStart(2, '0')}.${String(parteCentesimas).padStart(2, '0')}`;
    return minutos > 0 ? `${String(minutos).padStart(2, '0')}:${parteSegundos}` : parteSegundos;
}

export function tiempoPromedioLegible(sumaCentesimas, cantidad) {
    if (!cantidad) return '—';
    // Se muestran centésimas truncadas; el orden usa la fracción exacta.
    return tiempoLegible(Math.floor(sumaCentesimas / cantidad));
}

export function intentoLegible(valor) {
    if (!valor) return '—';
    return String(valor).replace(/^00:/, '');
}

export function estadisticasCompetidor(competidor, formato, cantidadIntentosFormato) {
    const cantidad = Number(cantidadIntentosFormato) || 0;
    const valores = (competidor.intentos ?? []).slice(0, cantidad);
    const tiempos = valores.map(centesimas);
    const validos = tiempos.filter((tiempo) => tiempo !== null);
    const mejor = validos.length ? Math.min(...validos) : null;
    const completo = cantidad > 0 && valores.length === cantidad && valores.every((tiempo) => tiempo !== '');
    let promedio = null;
    let resultado = null;

    if (completo) {
        if (String(formato).toUpperCase().startsWith('BO')) {
            resultado = mejor ?? Infinity;
        } else if (String(formato).toUpperCase() === 'AO5') {
            const promediar = [...tiempos].sort((a, b) => (a ?? Infinity) - (b ?? Infinity)).slice(1, -1);
            if (promediar.some((tiempo) => tiempo === null)) {
                promedio = Infinity;
            } else {
                const sumaPromedio = promediar.reduce((suma, tiempo) => suma + tiempo, 0);
                promedio = sumaPromedio / promediar.length;
            }
            resultado = promedio;
        } else {
            promedio = tiempos.some((tiempo) => tiempo === null)
                ? Infinity
                : tiempos.reduce((suma, tiempo) => suma + tiempo, 0) / tiempos.length;
            resultado = promedio;
        }
    }

    const valoresPromedio = String(formato).toUpperCase() === 'AO5'
        ? [...tiempos].sort((a, b) => (a ?? Infinity) - (b ?? Infinity)).slice(1, -1)
        : tiempos;
    const promedioSuma = valoresPromedio.every((tiempo) => tiempo !== null)
        ? valoresPromedio.reduce((suma, tiempo) => suma + tiempo, 0)
        : null;
    return { mejor, promedio, resultado, completo, promedioSuma, promedioCantidad: valoresPromedio.length };
}

export function compararResultados(a, b) {
    if (a.resultado === null) return b.resultado === null
        ? (a.nombre || '').localeCompare(b.nombre || '', 'es')
        : 1;
    if (b.resultado === null) return -1;
    const ambosPromedios = Number.isFinite(a.promedio) && Number.isFinite(b.promedio);
    const diferencia = ambosPromedios
        ? a.promedioSuma * b.promedioCantidad - b.promedioSuma * a.promedioCantidad
        : (a.resultado ?? Infinity) - (b.resultado ?? Infinity);
    return diferencia || (a.nombre || '').localeCompare(b.nombre || '', 'es');
}
