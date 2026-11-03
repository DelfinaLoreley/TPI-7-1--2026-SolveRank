import imagenPredeterminadaTorneo from '/src/assets/img-cubo-banner2.png';

export default function ImagenTorneo({ pathImagen, urlBackend = '', ...props }) {
    const src = pathImagen ? `${urlBackend}${pathImagen}` : imagenPredeterminadaTorneo;

    function usarImagenPredeterminada(evento) {
        evento.currentTarget.onerror = null;
        evento.currentTarget.src = imagenPredeterminadaTorneo;
    }

    return <img {...props} src={src} onError={usarImagenPredeterminada} />;
}
