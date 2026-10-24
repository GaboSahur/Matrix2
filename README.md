<<<<<<< HEAD
# NumeraX — Juego de matemática con ranking global (HTML + CSS + JS + Firebase)

Sitio armado con **HTML, CSS y JavaScript puro** (módulos ES6 nativos, sin
build step ni frameworks), pensado para el Proyecto Final Avanzado de
Jóvenes creaTIvos. Cubre los entregables de la consigna:

| Consigna | Dónde está |
|---|---|
| Página de inicio con marca propia | `index.html` |
| Catálogo de productos/servicios | `catalogo.html` (catálogo de niveles del juego) |
| Formulario de contacto real | `contacto.html` + `js/contacto.js` |
| Panel de administrador con login | `login.html` + `admin.html` + `js/auth.js` |
| Funcionalidad con IA personalizada | Dificultad adaptativa (`game.js`) + Gemini (`firebase-ai.js`, `jugar-ia.js`, `chatbot.html`) + backend de Claude opcional (`backend/`) |
| **Registro y ranking de usuarios** | `registro.html`, `ingresar.html`, `ranking.html` + Firebase |

## Cómo probarlo

Abrí `index.html` en el navegador. **Ojo**: como ahora usa `import`
(módulos ES6) para todo lo de Firebase, algunos navegadores bloquean esos
imports si abrís el archivo directo con `file://`. Usá un servidor local
para desarrollar:

```bash
npx serve .
```

o la extensión **Live Server** de VS Code. En GitHub Pages funciona sin
problema porque ahí sí se sirve por `https://`.

## Primer paso: poné tu nombre de marca

Abrí `js/config.js` y cambiá `BRAND_NAME`. Se actualiza solo en todo el sitio.

---

## Configurar Firebase (obligatorio para que el registro y el ranking funcionen)

El juego en sí (`jugar.html` sin sesión iniciada) funciona sin Firebase.
Pero para que el registro, login y ranking global anden, seguí estos pasos:

### 1. Creá el proyecto

1. Andá a [console.firebase.google.com](https://console.firebase.google.com) y creá un proyecto nuevo (es gratis, no pide tarjeta).
2. Dentro del proyecto, tocá el ícono `</>` para agregar una "app web". Ponele un nombre (ej: "numerax-web") y **no** marques Firebase Hosting (ya usás GitHub Pages).
3. Firebase te va a mostrar un bloque `firebaseConfig` con 6 valores (`apiKey`, `authDomain`, etc.). Copialos.

### 2. Pegá tu configuración

Abrí `js/firebase-config.js` y reemplazá el objeto `firebaseConfig` por el que te dio Firebase:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

### 3. Activá Authentication

En el panel de Firebase: **Build → Authentication → Get started → Sign-in method**.
Activá el proveedor **"Correo electrónico/contraseña"** (Email/Password). Con eso alcanza.

### 4. Activá Firestore

**Build → Firestore Database → Create database**. Elegí modo de producción
(las reglas de abajo se encargan de la seguridad) y la región más cercana
(ej: `southamerica-east1`).

### 5. Configurá las reglas de seguridad

En **Firestore Database → Reglas**, pegá esto y publicá:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Perfil de cada usuario: solo su dueño puede escribir en el suyo.
    match /usuarios/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Partidas jugadas: cualquiera puede leer (para armar el ranking),
    // pero solo se puede crear una partida a nombre de uno mismo,
    // y no se puede editar ni borrar después de creada.
    match /partidas/{partidaId} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

Esto evita que alguien, editando el JavaScript en su navegador, guarde
puntajes a nombre de otro usuario o infle su propio puntaje escribiendo
directo en la base sin pasar por el juego.

### 6. Primer uso: creá el índice compuesto

Los rankings semanal y mensual filtran por fecha *y* ordenan por puntaje
al mismo tiempo — Firestore necesita un índice compuesto para eso, y no
lo crea solo. La primera vez que abras `ranking.html` con datos reales,
si ves un error en la consola del navegador que dice algo como *"The
query requires an index"*, **tiene un link adentro del mismo mensaje de
error**: tocalo, te lleva directo a crear el índice con un clic en la
consola de Firebase. Tarda 1-2 minutos en activarse.

---

## Estructura

```
MatriiX/
├── index.html · catalogo.html · jugar.html · contacto.html
├── registro.html · ingresar.html · ranking.html     (cuentas y ranking global)
├── chatbot.html                                      (chat de dudas con IA)
├── login.html · admin.html                           (panel admin demo, sin Firebase)
├── css/style.css
├── js/
│   ├── config.js              Marca, credenciales demo del admin, CLAUDE_BACKEND_URL
│   ├── common.js              Menú, marca, año del footer
│   ├── content-library.js     TODOS los niveles (el catálogo se arma solo desde acá)
│   ├── game.js                Motor del juego (módulo)
│   ├── respuestas.js          Corrige respuestas: números con coma/punto y fracciones
│   ├── generadores/           fracciones.js · decimales.js · porcentajes.js
│   ├── firebase-config.js     Núcleo de Firebase: app, auth, db
│   ├── firebase-auth.js       Registro / login / logout
│   ├── firebase-ranking.js    Guardar partidas + rankings
│   ├── firebase-ai-config.js  Gemini + App Check (solo se carga si hace falta)
│   ├── firebase-ai.js         Pistas, ejercicios y chat con Gemini
│   ├── jugar-cloud.js         Fin de partida -> ranking global
│   ├── jugar-ia.js            Puente juego <-> IA (eventos, timeouts, plan B)
│   ├── chatbot.js · nav-session.js · registro.js · ingresar.js · ranking-page.js
│   └── auth.js · contacto.js  Login admin demo y formulario de contacto
└── backend/                   Servidor Node (opcional) para pistas con Claude
    ├── servers.js · routes/pistas-claude.js · package.json
    └── .env.example           (copialo como .env: ese archivo NO se sube a GitHub)
```

## Niveles

Se definen en `js/content-library.js` y el catálogo los muestra solos:
sumas, restas, multiplicación, división, mixto, potencias, porcentajes,
fracciones y **Desafío IA**. Para agregar uno: sumá su entrada a
`CONTENT_LIBRARY` y su lógica en `generarProblema()` de `game.js`.

- **Fracciones** se responden como `3/4` (se acepta cualquier equivalente, ej. `6/8`).
- **Decimales y porcentajes** aceptan coma o punto (`4,95` = `4.95`).
- `generadores/decimales.js` ya está cableado en `game.js`, pero el nivel
  "decimales" todavía no existe en `CONTENT_LIBRARY`: agregá la entrada y funciona.

## Cómo funciona el ranking (modelo de datos)

Dos colecciones en Firestore:

- **`usuarios/{uid}`** → `{ nombre, email, mejorPuntaje, creadoEn }`
  Un documento por jugador, con su mejor puntaje histórico.
- **`partidas/{autoId}`** → `{ uid, nombre, puntaje, nivel, creadoEn }`
  Un documento nuevo por cada partida jugada (logueado).

Los rankings semanal y mensual filtran `partidas` por `creadoEn >= inicio
del período` y ordenan por `puntaje`. Como cada jugador puede tener
varias partidas en el mismo período, `firebase-ranking.js` pide de más
(50 resultados) y se queda con la **primera aparición de cada jugador**
—que, al venir ordenado de mayor a menor puntaje, es justo su mejor
marca de ese período— hasta completar el top 10. Es una forma simple de
lograr "un puesto por jugador" sin necesitar una consulta más compleja.

## game.js sigue funcionando solo (sin Firebase)

`game.js` no importa nada de Firebase: al terminar una partida, solo
dispara un evento (`numerax:partida-finalizada`) con el resultado.
`jugar-cloud.js` —un módulo aparte— escucha ese evento y, si hay sesión
iniciada, lo sincroniza con Firestore. Si sacás `jugar-cloud.js` de
`jugar.html`, el juego sigue andando perfecto, simplemente no se guarda
en el ranking global. Esta separación evita que el motor del juego
dependa de una librería externa para funcionar.

## IA

| Funcionalidad | Dónde | Cómo funciona |
|---|---|---|
| **Pistas inteligentes** | Todos los niveles, al equivocarte | Se muestra al instante la pista por reglas y, en paralelo, la IA genera una en lenguaje natural que la reemplaza si llega a tiempo (6 s). |
| **Desafío IA** | `jugar.html?nivel=ia` | Gemini inventa cada ejercicio (enunciado + respuesta + pista) como JSON. El reloj se pausa mientras piensa. Si falla o tarda, se usa un ejercicio local: el juego nunca se traba. |
| **Chat de dudas** | `chatbot.html` | Conversación con memoria con un tutor que guía sin dar la respuesta final. |

`game.js` no sabe que existe la IA: solo emite y escucha eventos
(`numerax:pedir-problema-ia`, `numerax:problema-ia-listo`,
`numerax:pedir-pista-ia`, `numerax:pista-ia-lista`). `jugar-ia.js` es el
puente y decide el proveedor. Para las **pistas** prueba, en orden:

1. **Backend de Claude** (carpeta `backend/`), si hay uno configurado.
2. **Gemini** vía Firebase AI Logic (funciona directo desde GitHub Pages).

Para el **Desafío IA** y el **chat** se usa solo Gemini.

### Activar Gemini (Firebase AI Logic)

1. **Firebase Console → Servicios de IA → AI Logic → Comenzar.**
2. Elegí **"Gemini Developer API"** (funciona con el plan gratis Spark; el de Vertex/Agent Platform exige plan Blaze).
3. El asistente activa **App Check** y te da una **site key de reCAPTCHA v3**. Pegala en `js/firebase-ai-config.js`, en `RECAPTCHA_SITE_KEY` (es pública, no un secreto).
4. En reCAPTCHA agregá el dominio `gabosahur.github.io` (y `localhost` para probar en tu compu).

Si la IA no responde, el juego sigue andando. Abrí la consola (F12): errores
`appCheck/...` o `403` = falta la site key o el dominio; `429` = se agotó la
cuota gratis por un rato.

### Backend de Claude (opcional)

```bash
cd backend
cp .env.example .env     # completá CLAUDE_API_KEY
npm install
npm run dev              # http://localhost:3001  (prueba: /health)
```

- En tu compu, el juego lo usa solo (si está corriendo en `localhost:3001`).
- **GitHub Pages no ejecuta Node.** Para usarlo online hay que publicar `backend/` en un servidor (Render, Railway...), poner su URL https en `CLAUDE_BACKEND_URL` (`js/config.js`) y definir `ALLOWED_ORIGIN=https://gabosahur.github.io` en el servidor para que solo tu sitio pueda usarlo. Sin eso, quien encuentre la URL podría gastar tu crédito.
- Modelo por defecto: `claude-haiku-5-5` (se cambia con `CLAUDE_MODEL`).

> ⚠️ **Nunca subas `backend/.env` a GitHub.** Está en `.gitignore`. Si alguna vez
> se subió una clave real, borrarla del repo no alcanza (queda en el historial):
> **revocala y creá una nueva** en console.anthropic.com.

## Login de administrador (demo, separado de las cuentas de jugador)

- Usuario: `admin` · Contraseña: `matematica2026` (en `js/config.js`)

Este login **no tiene nada que ver con Firebase**: es el mismo candado
de demostración de antes, para el panel de mensajes de contacto. Las
cuentas de jugador (registro/ingresar) sí son reales, manejadas por
Firebase Authentication.

## Reglas del proyecto que ya cumple

- Responsive (probado desde 360px de ancho).
- Código separado en HTML / CSS / JS, con comentarios explicando decisiones técnicas.
- Sin frameworks: Firebase se usa vía su SDK modular como imports nativos de JS, sin npm ni bundler.

## Pendiente de tu lado

1. Reemplazar `BRAND_NAME` en `js/config.js`.
2. Crear tu proyecto de Firebase y completar `js/firebase-config.js` (ver arriba).
3. Activar Email/Password en Authentication y crear Firestore con las reglas de seguridad de arriba.
4. Probar el registro/login, jugar una partida logueado, y confirmar que aparece en `ranking.html`.
5. Subir todo a un repo de GitHub (mínimo 15 commits) y publicar con GitHub Pages.
=======
# Matrix2
>>>>>>> c18abdef3517a4ae21d02e7d81d517a698954935
