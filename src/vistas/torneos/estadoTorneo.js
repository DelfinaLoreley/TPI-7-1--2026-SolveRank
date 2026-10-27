function fechaLocal(fecha) {
    if (!fecha) return null;
    const valorFecha = fecha instanceof Date
        ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
        : String(fecha).slice(0, 10);
    const [anio, mes, dia] = valorFecha.split('-').map(Number);
    if (!anio || !mes || !dia) return null;
    const valor = new Date(anio, mes - 1, dia);
    return Number.isNaN(valor.getTime()) ? null : valor;
}

export function estadoTorneo(torneo) {
    const inicio = fechaLocal(torneo.fecha_Inicio);
    const fin = fechaLocal(torneo.fecha_fin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fin && hoy > fin) return 'Finalizado';
    if (inicio && hoy < inicio) return 'Próximo';
    if (inicio) return 'En curso';
    return 'Por confirmar';
}
