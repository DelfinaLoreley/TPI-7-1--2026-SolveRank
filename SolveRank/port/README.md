# tnoodle-native

Biblioteca independiente para **Node.js 22+**, orientada a torneos **no
oficiales**. Genera texto, SVG por estado, hojas PDF y archivos ZIP.
No es un programa aprobado por la WCA.

El motor es un port **ahead-of-time a JavaScript directo** de
[`tnoodle-lib` v0.20.0](https://github.com/thewca/tnoodle-lib/tree/b7f9bfeca5d43856e551e975ba305c36a3b86fcb),
no una reimplementacion simplificada ni un adaptador HTTP. TeaVM traduce los
solvers originales y los helpers de biblioteca alcanzables; la API, workers
y exportadores son TypeScript estricto. **No ejecuta Java, JVM, bytecode,
interpretes ni WebAssembly en produccion.** El JavaScript generado se incluye
en el proyecto y en el paquete. Solo regenerar ese motor y ejecutar las
pruebas diferenciales requiere JDK/Maven.

## Uso local

```powershell
npm ci
npm run build
npm run example
```

El ejemplo escribe `artifacts/scrambles.json`, `scrambles.pdf` y
`scrambles.zip`. No publica nada ni crea un servicio.

```js
import { TNoodle } from 'tnoodle-native';
import { writeFile } from 'node:fs/promises';

const tnoodle = new TNoodle({ workers: 1, maxQueue: 8, timeoutMs: 300_000 });
try {
  const batch = await tnoodle.generateScrambles({
    event: '333',
    count: 5,
    extraCount: 2,
  });
  const svg = await tnoodle.renderScrambleSvg({
    event: '333',
    scramble: batch.attempts[0].scrambles[0].text,
  });
  const sheets = {
    competition: 'Torneo local',
    sheets: [{ batch, round: 'Ronda 1', group: 'Grupo A' }],
  };
  await writeFile('mezclas.pdf', await tnoodle.createScrambleSheetsPdf(sheets));
  await writeFile('mezclas.zip', await tnoodle.createScrambleArchive(sheets));
} finally {
  await tnoodle.close();
}
```

Para consumir la carpeta desde otro proyecto: ejecutar `npm pack` despues
de `npm run build`, e instalar el `.tgz` resultante. No hay publicacion npm
ni integracion de backend incluida.

Tambien se exportan `generateScrambles`, `renderScrambleSvg`,
`createScrambleSheetsPdf`, `createScrambleArchive` y `closeWorkers`, usando
un cliente compartido. `closeWorkers()` cierra ese cliente permanentemente;
para reiniciar, crear otro `TNoodle`. La instancia admite `await using`
en entornos con soporte para `Symbol.asyncDispose`.

## Catalogo

Catalogo de 17 eventos contrastado con
[Reglamento WCA 9b](https://www.worldcubeassociation.org/regulations/#9b)
el 2026-10-16. No se infiere oficialidad del registro master de TNoodle.

| IDs | Motor y reglas |
| --- | --- |
| `222` | Estados aleatorios, solver 2x2 y filtro de distancia |
| `333`, `333oh` | min2phase, estados aleatorios y restricciones originales |
| `444` | threephase completo; **no** variante de giros aleatorios |
| `555`, `666`, `777` | Reglas de giros/capas y normalizacion de TNoodle |
| `333bf`, `444bf`, `555bf` | Variantes NoInspection y orientaciones BLD |
| `333fm` | Prefijo/sufijo `R' U' F` y restricciones de ejes |
| `pyram`, `skewb` | Solvers y filtros originales |
| `sq1` | sq12phase, estados y movimientos legales |
| `clock`, `minx` | Generadores y estados originales |
| `333mbf` | Intentos con multiples mezclas `333ni` |

FTO, UI, cuentas WCA, WCIF completo, cifrado y traducciones exhaustivas
quedan fuera del alcance. El formato Head-to-Head no introduce un motor
de mezclas diferente y no tiene una plantilla de torneo propia.

`count` cuenta intentos principales, `extraCount` agrega intentos extra.
Por defecto se generan 5 intentos para eventos de promedio y 333 BLD,
3 para 6x6/7x7, FMC y BLD grandes. En Multi-Blind se requiere
`cubesPerAttempt`, y cada extra tambien contiene ese numero de cubos:

```js
const multiBlind = await tnoodle.generateScrambles({
  event: '333mbf',
  count: 3,
  cubesPerAttempt: 20,
  extraCount: 1,
});
```

La respuesta `ScrambleBatch` incluye UUID, fecha, evento, motor, revision,
intentos numerados, indicador `extra` y `scrambles: [{ text, svg }]`.
Esta congelada recursivamente. Mantener este conjunto privado: el ZIP
**no esta cifrado** y sus manifiestos contienen todas las mezclas.

## Exportacion

Los exportadores **no generan mezclas nuevas**. Usan los textos del batch
recibido y vuelven a aplicar sus movimientos en el worker para obtener SVG
confiable; no insertan SVG arbitrario de un JSON importado.
La entrada se valida y se copia antes de esperar operaciones asincronas.

El PDF usa A4, paginacion de texto, diagramas vectoriales y extras
identificados. FMC tiene una hoja individual por intento con espacio
para solucion, datos del competidor y limite de una hora. Multi-Blind
separa intentos y numera cada cubo, incluso al atravesar varias paginas.
No reproduce las plantillas oficiales ni garantiza identidad visual.

El ZIP contiene `scrambles.pdf`, `manifest.json`, archivos de texto y un
SVG por cubo. Las rutas usan indices/UUIDs y no incorporan nombres
arbitrarios de grupos o torneos. El manifiesto conserva evento, ronda,
grupo, extras, agrupacion y procedencia del motor.

Los encabezados admiten Latin-1 y Euro con las fuentes PDF estandar;
se rechazan caracteres no soportados en vez de imprimir glifos incorrectos.
No hay descarga de fuentes o recursos externos.

## Ejecucion y limites

Las tablas se inicializan perezosamente dentro de `worker_threads`.
La generacion y el renderizado de estados no ejecutan solvers en el hilo
principal. Cada cliente mantiene sus propios workers/tablas, sin
almacenamiento global compartido entre procesos.

| Limite | Valor |
| --- | --- |
| Workers por cliente | 1 por defecto; 1-4 |
| Trabajos esperando | 8 por defecto; 0-64 |
| Tiempo por trabajo, incluida cola/inicializacion | 300 s por defecto; 1 ms-1 hora |
| Intentos / extras por batch | 100 / 20 |
| Cubos por intento Multi-Blind | 1-100 |
| Mezclas individuales totales por batch | 200 |
| Batches / mezclas por exportacion | 100 / 1000 |
| Longitud de algoritmo / etiqueta | 20.000 / 160 caracteres |

Un trabajo de generacion produce un batch atomico: no se devuelve un lote
parcial como completo. Los trabajos son FIFO; cola llena produce
`QUEUE_FULL`, sin descartar mezclas silenciosamente.

La primera generacion 4x4 puede tardar alrededor de un minuto en el
entorno Windows de desarrollo; no es un SLA. Tres tablas grandes se
conservan por worker para reutilizarlas. La memoria depende de V8 y el
evento; un worker puede consumir cientos de MiB. El limite de heap V8
por worker es 512 MiB, pero **no limita el RSS ni todos los buffers externos**.
Empezar con un worker y medir antes de aumentar concurrencia. No hay
un limite de memoria global del proceso impuesto por esta biblioteca.

`AbortSignal` se admite en generacion, render y exportacion. Cancelar o
agotar el tiempo de un solver termina su worker y desecha el trabajo;
el siguiente trabajo reconstruye las tablas. `close()` rechaza cola y
trabajos activos, espera su terminacion y es idempotente. Los workers
inactivos no mantienen vivo el proceso.

El montaje del PDF sucede en el hilo principal despues del renderizado
asincrono. Sus limites evitan documentos ilimitados, pero trabajos PDF
grandes pueden ocupar brevemente ese hilo. La compresion ZIP es asincrona.
La cancelacion del PDF se comprueba entre bloques; no interrumpe una
llamada sincronica de PDFKit. El timeout del cliente cubre cada trabajo
de solver/render, no el tiempo completo del documento.

Errores tipados `TNoodleError.code`: `INVALID_INPUT`, `INVALID_SCRAMBLE`,
`QUEUE_FULL`, `ABORTED`, `TIMEOUT`, `CLOSED`, `ENGINE_ERROR`, `EXPORT_ERROR`.
No se sustituyen fallos por generadores mas simples ni se registran
mezclas privadas en logs. El generador de produccion usa `node:crypto`
y muestreo entero con rechazo, sin sesgo modulo ni `Math.random`.
No se ofrece una API publica por semilla.

## Referencia y regeneracion del motor

La referencia del motor es el commit real de la etiqueta `v0.20.0`,
`b7f9bfeca5d43856e551e975ba305c36a3b86fcb`, no el HEAD investigado
originalmente. Es coherente con `lib-scrambles:0.20.0` declarado por
el servidor de referencia. Ver `tools/reference/sources.json`.

Se incluyen fuentes originales sin modificar en `tools/native/upstream`,
adaptaciones/puente en `tools/native/java`, transformaciones explicitas en
`prepare.mjs` y checksums de fuentes/salida. **El motor generado no debe
editarse a mano.** La regeneracion requiere JDK 17+, Maven 3.9+ y acceso
a Maven Central si las herramientas/dependencias no estan en cache:

```powershell
$env:JAVA_HOME = 'C:\ruta\al\jdk-17'
# Maven en PATH, o tools\toolchain\apache-maven-3.9.9
npm run engine:build
npm run build
```

`tools/native/build.ps1` tambien detecta un JDK en `tools/toolchain/jdk-*`.
No se descarga ni ejecuta Java desde los scripts de instalacion,
`npm run build` o la API. Para otras plataformas se puede ejecutar
`node tools/native/prepare.mjs`, `mvn -f tools/native/pom.xml package`
y `node tools/native/stamp.mjs`.

La transformacion conserva los algoritmos y la semantica entera Java;
cambia el proveedor de aleatoriedad, logs, serializacion XML y el acceso
al entorno JVM. `PortRandom` implementa explicitamente los metodos de
muestreo porque `Random` de TeaVM usa `Math.random` e ignora las semillas.
`ReferenceRandom` y los probes internos del motor son herramientas de
prueba, no parte de la superficie publica exportada del paquete.

## Verificacion

```powershell
npm test
npm run test:reference
npm run test:package
```

`npm test` no requiere Java: comprueba los 17 eventos, SVG como XML,
contenido y limites de pagina PDF, integridad ZIP, extras, FMC/Multi-Blind,
reutilizacion de mezclas, entradas negativas, entropia/rechazo, cola,
cancelacion, timeout y cierre.

`test:reference` compila **las fuentes originales no modificadas** y
compara transiciones, estados normalizados, facelets 3x3, SVG y tablas
con Java. Acepta soluciones distintas de busquedas temporizadas si
alcanzan el mismo estado objetivo normalizado. Compara tambien el
muestreo Java de 48 bits con semillas y limites extremos. Requiere
JDK 17 y los jars de referencia resueltos con:

```powershell
mvn -f tools\native\pom.xml dependency:copy-dependencies -DoutputDirectory=dependency
```

La prueba registra las aserciones upstream al intentar volver a canonizar
algoritmos especiales, como ciertas orientaciones de tres capas de 4BLD
y secuencias Clock. Exige reproducir la misma asercion en Java.
La generacion original evita esa recanonizacion, y el port conserva ese
comportamiento; la API publica aplica directamente la secuencia final.

`test:package` crea e instala el paquete en una carpeta aislada usando
`npm --offline --ignore-scripts --omit=dev`, verifica las fuentes incluidas
y genera texto/SVG/PDF/ZIP con PATH/JAVA_HOME vacios y procesos/red
deshabilitados en el proceso de comprobacion. Requiere el cache npm
llenado por la instalacion de desarrollo. Los informes y documentos de
ejemplo quedan en `artifacts/`, no son parte del paquete.

Estas pruebas son evidencia de regresion funcional, **no una
certificacion WCA ni una prueba matematica exhaustiva**. No se exige
identidad de cadenas por semilla o documentos binariamente identicos.

## Licencias

El derivado se distribuye bajo **GPL-3.0-only**. Se conservan las fuentes,
avisos y licencia de TNoodle, y los terminos GPL-3.0-or-later de archivos
individuales que los conceden. Helpers generados de TeaVM: Apache-2.0.
PDFKit, svg-to-pdfkit y fflate: MIT. Ver `LICENSE`, `NOTICE` y `licenses/`.

No se copia codigo del servidor Kotlin/AGPL ni de iText; los exportadores
son nuevos. Revisar las obligaciones GPL antes de combinar/distribuir
el paquete con un backend propietario. Esto no es asesoramiento juridico.
