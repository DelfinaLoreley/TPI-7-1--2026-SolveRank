import iconoSubida from '/src/assets/torneos/subir-img-crear-torneo-icon.png';
import { Campo, CampoEquipo, CampoSelect } from './CamposTorneo';

export function PasoInformacion({
    formulario,
    onCambio,
    onCambioImagen,
    onAgregarPersona,
    onQuitarPersona,
    error,
    organizador,
    imagen
}) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <h2>
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M6 2.75h8l5 5v13.5H6a2 2 0 0 1-2-2v-14.5a2 2 0 0 1 2-2Z" />
                        <path d="M14 2.75v5h5M8 13h8M8 17h8" />
                    </svg>
                    Información general
                </h2>
                <p>Completá los datos básicos del torneo.</p>
            </div>

            <div className="creacion-informacion-grid">
                <div className="creacion-columna">
                    <Campo
                        etiqueta="Nombre del torneo"
                        placeholder="Ej.: Ushuaia Open 2027"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={onCambio}
                        maxLength={100}
                        autoComplete="off"
                        error={error.nombre}
                    />
                    <CampoSelect
                        etiqueta="Organizador principal"
                        opciones={[organizador || 'Mi organización']}
                        name="organizador"
                        value={formulario.organizador}
                        onChange={onCambio}
                    />
                    <Campo
                        etiqueta="Contacto"
                        placeholder="Escribí el contacto del organizador"
                        name="contacto"
                        value={formulario.contacto}
                        onChange={onCambio}
                        autoComplete="email"
                    />
                    <label className="creacion-campo">
                        <span className="creacion-etiqueta">Descripción adicional</span>
                        <textarea
                            className="creacion-input creacion-textarea"
                            name="descripcion"
                            value={formulario.descripcion}
                            onChange={onCambio}
                            placeholder="Breve descripción adicional del torneo."
                            rows="4"
                            maxLength="1000"
                        />
                        <span className="creacion-ayuda">{formulario.descripcion.length}/1000 caracteres</span>
                    </label>
                    <Campo
                        etiqueta="Dirección del lugar"
                        placeholder="Ej.: Avenida San Martín 123"
                        name="direccion"
                        value={formulario.direccion}
                        onChange={onCambio}
                    />
                    <CampoEquipo
                        etiqueta="Seleccioná el/los jueces"
                        nombre="jueces"
                        opciones={['Feliks Zemdegs', 'Guido Diepietro']}
                        formulario={formulario}
                        onCambio={onCambio}
                        onAgregar={onAgregarPersona}
                        onQuitar={onQuitarPersona}
                    />
                </div>

                <div className="creacion-columna creacion-columna-derecha">
                    <label className="creacion-campo">
                        <span className="creacion-etiqueta">Imagen del torneo</span>
                        <span className="creacion-subida">
                            <img src={iconoSubida} alt="" />
                            <span>{imagen?.name || 'Poné una imagen del local del torneo, o la ciudad.'}</span>
                            <small>JPG, SVG, PNG.</small>
                            <input
                                type="file"
                                name="imagen"
                                accept="image/jpeg,image/png,image/svg+xml"
                                onChange={onCambioImagen}
                                aria-label="Elegir imagen del torneo"
                            />
                        </span>
                    </label>
                    <div className="creacion-fechas">
                        <Campo
                            etiqueta="Fecha Inicio"
                            type="datetime-local"
                            name="fechaInicio"
                            value={formulario.fechaInicio}
                            onChange={onCambio}
                            error={error.fechaInicio}
                        />
                        <Campo
                            etiqueta="Fecha Fin"
                            type="datetime-local"
                            name="fechaFin"
                            value={formulario.fechaFin}
                            onChange={onCambio}
                            error={error.fechaFin}
                        />
                    </div>
                    <div className="creacion-ubicacion">
                        <CampoSelect
                            etiqueta="País"
                            opciones={['Argentina', 'Chile', 'Uruguay', 'Brasil']}
                            name="pais"
                            value={formulario.pais}
                            onChange={onCambio}
                        />
                        <CampoSelect
                            etiqueta="Provincia o estado"
                            opciones={[
                                'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut',
                                'Ciudad Autónoma de Buenos Aires', 'Córdoba', 'Corrientes',
                                'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
                                'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
                                'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
                                'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
                            ]}
                            name="provincia"
                            value={formulario.provincia}
                            onChange={onCambio}
                        />
                    </div>
                    <Campo
                        etiqueta="Ciudad"
                        placeholder="Seleccioná la ciudad"
                        name="ciudad"
                        value={formulario.ciudad}
                        onChange={onCambio}
                        error={error.ciudad}
                    />
                    <Campo
                        etiqueta="Lugar/Venue del torneo"
                        placeholder="Ej.: Centro cultural"
                        name="sede"
                        value={formulario.sede}
                        onChange={onCambio}
                        error={error.sede}
                    />
                    <CampoEquipo
                        etiqueta="Seleccioná el/los delegados de la WCA"
                        nombre="delegados"
                        opciones={['Guido Diepietro', 'Feliks Zemdegs']}
                        formulario={formulario}
                        onCambio={onCambio}
                        onAgregar={onAgregarPersona}
                        onQuitar={onQuitarPersona}
                    />
                </div>
            </div>
        </>
    );
}
