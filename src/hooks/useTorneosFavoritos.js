import { useCallback, useEffect, useState } from 'react';
import axios from '../axiosApi';

function useTorneosFavoritos(usuario) {
    const [favoritos, setFavoritos] = useState(() => new Set());
    const [actualizando, setActualizando] = useState(() => new Set());
    const [errorFavoritos, setErrorFavoritos] = useState('');

    useEffect(() => {
        let activo = true;
        if (!usuario?.idUsuario) {
            setFavoritos(new Set());
            setErrorFavoritos('');
            return () => { activo = false; };
        }

        axios.get('/torneos/favoritos')
            .then(({ data }) => {
                if (activo) setFavoritos(new Set((data.favoritos ?? []).map(({ idTorneo }) => String(idTorneo))));
            })
            .catch((error) => {
                if (activo) setErrorFavoritos(error?.response?.data?.mensaje || 'No se pudieron cargar tus torneos guardados.');
            });
        return () => { activo = false; };
    }, [usuario?.idUsuario]);

    const alternarFavorito = useCallback(async (idTorneo) => {
        if (!usuario?.idUsuario) return false;
        const id = String(idTorneo);
        const estabaGuardado = favoritos.has(id);
        setErrorFavoritos('');
        setActualizando((actuales) => new Set(actuales).add(id));
        try {
            if (estabaGuardado) await axios.delete(`/torneos/favoritos/${id}`);
            else await axios.post(`/torneos/favoritos/${id}`);
            setFavoritos((actuales) => {
                const siguientes = new Set(actuales);
                if (estabaGuardado) siguientes.delete(id);
                else siguientes.add(id);
                return siguientes;
            });
            return true;
        } catch (error) {
            setErrorFavoritos(error?.response?.data?.mensaje || 'No se pudo actualizar el torneo guardado.');
            return false;
        } finally {
            setActualizando((actuales) => {
                const siguientes = new Set(actuales);
                siguientes.delete(id);
                return siguientes;
            });
        }
    }, [usuario?.idUsuario, favoritos]);

    return { favoritos, actualizando, errorFavoritos, alternarFavorito };
}

export default useTorneosFavoritos;
