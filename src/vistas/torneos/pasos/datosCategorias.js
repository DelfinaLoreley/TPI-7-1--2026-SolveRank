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
import iconMegaminx from '/src/assets/categorias/megaminx-icon.svg';
import iconPyraminx from '/src/assets/categorias/pyraminx icon.svg';
import iconSkewb from '/src/assets/categorias/skewb-icon.svg';
import icon2x2Selected from '/src/assets/categorias/2x2-icon-selected.png';
import icon3x3Selected from '/src/assets/categorias/3x3-icon-selected.png';
import icon3x3BlindSelected from '/src/assets/categorias/3x3-blind-icon-selected.png';
import icon3x3OneHandedSelected from '/src/assets/categorias/3x3-OH-icon-selected.png';
import icon4x4Selected from '/src/assets/categorias/4x4 icon-selected.png';
import icon4x4BlindSelected from '/src/assets/categorias/4x4-blind-icon-selected.png';
import icon5x5Selected from '/src/assets/categorias/5x5-icon-selected.png';
import icon5x5BlindSelected from '/src/assets/categorias/5x5-blind-icon-selected.png';
import icon6x6Selected from '/src/assets/categorias/6x6-icon-selected.png';
import icon7x7Selected from '/src/assets/categorias/7x7-icon-selected.png';
import iconMegaminxSelected from '/src/assets/categorias/megaminx-icon-selected.png';
import iconPyraminxSelected from '/src/assets/categorias/pyraminx-icon-selected.png';
import iconSkewbSelected from '/src/assets/categorias/skewb-icon-selected.png';

export const categorias = [
    { id: '3x3x3', etiqueta: '3x3x3', icono: icon3x3, iconoSeleccionado: icon3x3Selected },
    { id: '2x2x2', etiqueta: '2x2x2', icono: icon2x2, iconoSeleccionado: icon2x2Selected },
    { id: '4x4x4', etiqueta: '4x4x4', icono: icon4x4, iconoSeleccionado: icon4x4Selected },
    { id: '5x5x5', etiqueta: '5x5x5', icono: icon5x5, iconoSeleccionado: icon5x5Selected },
    { id: '6x6x6', etiqueta: '6x6x6', icono: icon6x6, iconoSeleccionado: icon6x6Selected },
    { id: '7x7x7', etiqueta: '7x7x7', icono: icon7x7, iconoSeleccionado: icon7x7Selected },
    { id: '3x3x3 a ciegas', etiqueta: '3x3 BLD', icono: icon3x3Blind, iconoSeleccionado: icon3x3BlindSelected },
    { id: '3x3x3 Una mano', etiqueta: '3x3 OH', icono: icon3x3OneHanded, iconoSeleccionado: icon3x3OneHandedSelected },
    { id: 'Megaminx', etiqueta: 'Megaminx', icono: iconMegaminx, iconoSeleccionado: iconMegaminxSelected },
    { id: 'Pyraminx', etiqueta: 'Pyraminx', icono: iconPyraminx, iconoSeleccionado: iconPyraminxSelected },
    { id: 'Skewb', etiqueta: 'Skewb', icono: iconSkewb, iconoSeleccionado: iconSkewbSelected },
    { id: '4x4x4 a ciegas', etiqueta: '4x4 BLD', icono: icon4x4Blind, iconoSeleccionado: icon4x4BlindSelected },
    { id: '5x5x5 a ciegas', etiqueta: '5x5 BLD', icono: icon5x5Blind, iconoSeleccionado: icon5x5BlindSelected }
];

export const categoriasDisponibles = categorias.map(({ id }) => id);

export function etiquetaCategoria(id, catalogo = []) {
    return catalogo.find((categoria) => String(categoria.id) === String(id))?.etiqueta || categorias.find((categoria) => categoria.id === id)?.etiqueta || id;
}

export { categoriasIcon };
