import categoriasIcon from '/src/assets/torneos/categorias-azul-icon.png';
import icon2x2 from '/src/assets/categorias/2x2-icon.svg';
import icon3x3 from '/src/assets/categorias/3x3-icon.svg';
import icon3x3Blind from '/src/assets/categorias/3x3-blind-icon.svg';
import icon3x3OneHanded from '/src/assets/categorias/3x3-OH-icon.svg';
import icon4x4 from '/src/assets/categorias/4x4-icon.svg';
import icon4x4Blind from '/src/assets/categorias/4x4-blind-icon.svg';
import icon5x5 from '/src/assets/categorias/5x5-icon.svg';
import icon5x5Blind from '/src/assets/categorias/5x5-blind-icon.svg';
import icon6x6 from '/src/assets/categorias/6x6-icon.svg';
import icon7x7 from '/src/assets/categorias/7x7-icon.svg';
import iconClock from '/src/assets/categorias/clock-icon.svg';
import iconMegaminx from '/src/assets/categorias/megaminx-icon.svg';
import iconPyraminx from '/src/assets/categorias/pyraminx icon.svg';
import iconSkewb from '/src/assets/categorias/skewb-icon.svg';

export const categorias = [
    { id: '3x3x3', etiqueta: '3x3x3', icono: icon3x3 },
    { id: '2x2x2', etiqueta: '2x2x2', icono: icon2x2 },
    { id: '4x4x4', etiqueta: '4x4x4', icono: icon4x4 },
    { id: '5x5x5', etiqueta: '5x5x5', icono: icon5x5 },
    { id: '6x6x6', etiqueta: '6x6x6', icono: icon6x6 },
    { id: '7x7x7', etiqueta: '7x7x7', icono: icon7x7 },
    { id: '3x3x3 a ciegas', etiqueta: '3x3 BLD', icono: icon3x3Blind },
    { id: '3x3x3 Una mano', etiqueta: '3x3 OH', icono: icon3x3OneHanded },
    { id: 'Clock', etiqueta: 'Clock', icono: iconClock },
    { id: 'Megaminx', etiqueta: 'Megaminx', icono: iconMegaminx },
    { id: 'Pyraminx', etiqueta: 'Pyraminx', icono: iconPyraminx },
    { id: 'Skewb', etiqueta: 'Skewb', icono: iconSkewb },
    { id: '4x4x4 a ciegas', etiqueta: '4x4 BLD', icono: icon4x4Blind },
    { id: '5x5x5 a ciegas', etiqueta: '5x5 BLD', icono: icon5x5Blind }
];

export const categoriasDisponibles = categorias.map(({ id }) => id);

export function etiquetaCategoria(id, catalogo = []) {
    return catalogo.find((categoria) => String(categoria.id) === String(id))?.etiqueta || categorias.find((categoria) => categoria.id === id)?.etiqueta || id;
}

export { categoriasIcon };
