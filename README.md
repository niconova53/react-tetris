# 🍬 React Tetris — *Sugar Rush*

Un juego de **Tetris** completo, construido con **React + TypeScript + Vite**, con una estética "candy" (Sugar Rush Playful System) y despliegue automático en GitHub Pages.

🔗 **Demo en vivo:** https://niconova53.github.io/react-tetris/

---

## ✨ Características

### Jugabilidad (fiel al Tetris clásico)
- **Gravedad automática** — las piezas caen solas con intervalos por nivel (tabla oficial Nintendo).
- **Soft drop** — `↓` mueve la pieza una celda por pulsación.
- **Hard drop** — `Espacio` deja caer la pieza instantáneamente y fija.
- **Lock delay de 500 ms** — la pieza queda fija 500 ms después de tocar el suelo/otra pieza; moverse o rotar durante esa ventana reinicia el temporizador.
- **Preview de la siguiente pieza** y sistema de **Hold** (`C`), una vez por pieza.
- **Limpieza de líneas**, **scoring Nintendo** (100/300/500/800 × nivel), y **progresión de nivel** cada 10 líneas.
- **Detección de game over** al colisionar una pieza nueva en su posición de spawn.

### Controles
| Tecla | Acción |
|-------|--------|
| `←` / `→` | Mover |
| `↑` | Rotar |
| `↓` | Soft drop |
| `Espacio` | Hard drop |
| `C` | Hold |
| `P` | Pausa |
| `R` | Reiniciar (tras game over) |

### Diseño
- **Sugar Rush Playful System**: paleta *candy* (fresa/arándano/limón sobre crema vainilla), paneles redondeados tipo *pill*, sombras "gummy", *inner glow* y *bottom bevel*.
- Tiles de las piezas con acabado "hard shell" (gradiente radial + bevel suave).
- Tipografías redondeadas: **Plus Jakarta Sans**, **Be Vietnam Pro**, **Quicksand**.
- **Responsive**: el juego escalado uniformemente (`transform: scale`) para que siempre quepa en pantalla sin desbordes.

---

## 🛠️ Tecnologías

- **React 18** + **TypeScript** (modo estricto)
- **Vite 5** (`@vitejs/plugin-react-swc`)
- **Vitest** para tests unitarios de la lógica del juego
- **GitHub Actions** para CI/CD (deploy automático a Pages)

---

## 🚀 Empezar

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Tests
npm test

# Build de producción
npm run build
```

---

## 📁 Estructura

```
src/
 ├─ game.ts        # Lógica pura del juego (tetrominos, rotación, colisión, scoring)
 ├─ game.test.ts   # Tests unitarios (Vitest)
 ├─ App.tsx        # UI + estado (hooks, timers, teclado)
 ├─ App.css        # Estilos (Sugar Rush system)
 └─ main.tsx       # Entry point
```

La lógica del juego está completamente separada de la UI (`game.ts` es puro, sin React), lo que facilita el testing y el mantenimiento.

---

## 🧪 Tests

14 tests unitarios cubren: rotación de piezas, detección de colisión, limpieza de líneas, scoring, progresión de nivel y game over.

```bash
npm test
```

---

## 🌐 Despliegue

El proyecto se despliega automáticamente en **GitHub Pages** con cada push a `main` (vía GitHub Actions, ver `.github/workflows/deploy.yml`).

- **URL:** https://niconova53.github.io/react-tetris/