import icon2x2 from '/src/assets/categorias/2x2-icon.svg';
import icon3x3 from '/src/assets/categorias/3x3-icon.svg';
import icon3x3Blind from '/src/assets/categorias/3x3-blind-icon.svg';
import icon3x3Fm from '/src/assets/categorias/3x3-fm-icon.svg';
import icon3x3MultiBlind from '/src/assets/categorias/3x3-multi-blind-icon.svg';
import icon4x4 from '/src/assets/categorias/4x4-icon.svg';
import icon4x4Blind from '/src/assets/categorias/4x4-blind-icon.svg';
import icon5x5 from '/src/assets/categorias/5x5-icon.svg';
import icon6x6 from '/src/assets/categorias/6x6-icon.svg';
import icon7x7 from '/src/assets/categorias/7x7-icon.svg';
import iconClock from '/src/assets/categorias/clock-icon.svg';
import iconMegaminx from '/src/assets/categorias/megaminx-icon.svg';
import iconPyraminx from '/src/assets/categorias/pyraminx icon.svg';
import iconSkewb from '/src/assets/categorias/skewb-icon.svg';
import iconSquare1 from '/src/assets/categorias/square-1-icon.svg';
import iconPremiacion from '/src/assets/torneos/premiacion-icon.svg'
import { etiquetaCategoria } from './datosCategorias';

const iconosCategoria = {
    '3x3x3': icon3x3,
    '2x2x2': icon2x2,
    '4x4x4': icon4x4,
    '5x5x5': icon5x5,
    '6x6x6': icon6x6,
    '7x7x7': icon7x7,
    '3x3x3 a ciegas': icon3x3Blind,
    '3x3x3 FMC': icon3x3Fm,
    '3x3x3 Una mano': icon3x3,
    Clock: iconClock,
    Megaminx: iconMegaminx,
    Pyraminx: iconPyraminx,
    Skewb: iconSkewb,
    'Square-1': iconSquare1,
    '4x4x4 a ciegas': icon4x4Blind,
    '5x5x5 a ciegas': icon5x5,
    '3x3x3 Multi-Blind': icon3x3MultiBlind,
    FTO: iconMegaminx
};

function formatearHora(fecha) {
    return new Intl.DateTimeFormat('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(fecha);
}

export function generarCronograma(fechaInicio, categorias, rondas) {
    if (!fechaInicio || categorias.length === 0) return [];

    const inicio = new Date(fechaInicio);
    if (Number.isNaN(inicio.getTime())) return [];

    let cursor = new Date(inicio);
    const actividades = [];

    function agregarActividad(nombre, duracion, icono = null) {
        const comienzo = new Date(cursor);
        cursor = new Date(cursor.getTime() + duracion * 60_000);
        actividades.push({
            id: `${actividades.length}-${nombre}`,
            comienzo: formatearHora(comienzo),
            fin: formatearHora(cursor),
            nombre,
            icono
        });
    }

    agregarActividad('Registro', 30);
    agregarActividad('Tutorial para nuevos competidores', 30);

    const cantidadMaximaRondas = Math.max(
        ...categorias.map((categoria) => Math.max(1, Number(rondas[categoria]?.cantidad) || 3))
    );

    for (let numero = 1; numero <= cantidadMaximaRondas; numero += 1) {
        categorias.forEach((categoria) => {
            const cantidad = Math.max(1, Number(rondas[categoria]?.cantidad) || 3);
            if (numero > cantidad) return;

            agregarActividad(
                `${etiquetaCategoria(categoria)} - Ronda ${numero}`,
                50,
                iconosCategoria[categoria]
            );
        });
    }

    categorias.forEach((categoria) => {
        agregarActividad(`${etiquetaCategoria(categoria)} - Final`, 50, iconosCategoria[categoria]);
    });

    agregarActividad('Premiación', 30, iconPremiacion );
    return actividades;
}
