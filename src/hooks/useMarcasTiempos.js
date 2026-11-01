import { useEffect, useState } from 'react';
import axios from '../axiosApi';

export default function useMarcasTiempos(registros = []) {
    const pares = [...new Set(registros
        .map(({ idCategoria, idUsuario }) => [Number(idCategoria), Number(idUsuario)])
        .filter(([idCategoria, idUsuario]) => Number.isSafeInteger(idCategoria) && idCategoria > 0
            && Number.isSafeInteger(idUsuario) && idUsuario > 0)
        .map(([idCategoria, idUsuario]) => `${idCategoria}:${idUsuario}`))].sort();
    const firma = `${pares.join(',')}|${JSON.stringify(registros)}`;
    const [marcas, setMarcas] = useState({});

    useEffect(() => {
        let activo = true;
        setMarcas({});
        const paresConsulta = firma.split('|', 1)[0].split(',').filter(Boolean);
        if (!paresConsulta.length) return () => { activo = false; };

        axios.post('/torneos/marcas-tiempos', { pares: paresConsulta })
            .then(({ data }) => {
                if (!activo) return;
                setMarcas(Object.fromEntries((data.marcas || []).map((marca) => [
                    `${marca.idCategoria}:${marca.idUsuario}`,
                    marca
                ])));
            })
            .catch(() => { if (activo) setMarcas({}); });
        return () => { activo = false; };
    }, [firma]);

    return marcas;
}
