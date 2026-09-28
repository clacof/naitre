# Plan: átomo del hero más impresionante

Objetivo: elevar el campo de partículas de `js/scroll/hero.js` de "marca que se forma" a "átomo vivo", sin romper el manifiesto Première Lumière (terracota escaso, vanilla, sin deps).

## Diagnóstico

**Lo que ya funciona**
- Formación coreografiada por scroll (stagger + easing), repulsión de cursor, bloom en la ignición, filamentos internos, rAF que duerme cuando no hay actividad.

**Debilidades detectadas**
1. **Geometría congelada.** Tras formarse, los anillos no rotan: un átomo sin órbitas. La "respiración" (±1.6px) es casi imperceptible.
2. **Plano 2D.** Sin profundidad: todos los anillos en el mismo plano, sin oclusión ni parallax. No hay sensación de volumen.
3. **Chispa estática.** El arco terracota se enciende y se queda quieto; pierde el drama de "primera luz".
4. **Filamentos O(n²) por frame** (~250 partículas → ~30k comparaciones), y `shadowBlur` por partícula spark: caro en móvil.
5. **Repulsión sin física.** Interpolación directa sin velocidad: las partículas vuelven sin rebote, se siente amortiguado en exceso.
6. **Núcleo inerte.** No pulsa; el bloom es fijo una vez encendido.

## Plan por fases

### F1 — Órbitas (el cambio de mayor impacto)
- Guardar en cada partícula `ringId` y ángulo base en `buildTargets`.
- Tras la formación (`progress > 0.82`), animar `angle = base + t * ω_ring`, con velocidades distintas y **contra-rotación** entre anillos (ext. lento horario, medio antihorario, interior rápido). Escalar ω por `breathe` para que la rotación "nazca" suavemente.
- Los ticks radiales permanecen fijos: contraste carta astronómica vs. electrones.

### F2 — Profundidad 3D fake
- Inclinar cada anillo como elipse (`y' = y·cosθ`, `z = y·sinθ`, θ distinto por anillo, ~55–70°).
- Modular tamaño y alpha por `z` (partículas "detrás" más pequeñas y tenues) → volumen inmediato, coste casi nulo.
- Precesión lenta de θ con el tiempo (+ ligera inclinación global siguiendo el puntero: parallax).

### F3 — Cometa terracota
- Sustituir el arco estático por **un cabezal brillante que recorre el anillo exterior** con estela que se desvanece (segmentos con alpha decreciente).
- Sigue siendo *el único* acento: cumple la regla de accent escaso y añade movimiento focal.
- El glow del cometa: un solo gradiente radial, no `shadowBlur` por partícula.

### F4 — Micro-vida
- Twinkle: modulación sutil de alpha por partícula (`sin(t·k + seed)`).
- Pulso del núcleo tipo latido (~0.15Hz) sincronizado con el bloom, que respira en radio y alpha.

### F5 — Física de interacción
- Repulsión con velocidad + spring damping (rebote leve al volver) en vez de lerp directo.
- Radio de influencia algo mayor (130→160px) con falloff cuadrático.

### F6 — Rendimiento
- Precomputar pares de filamentos una vez formado el átomo (la topología apenas cambia); recalcular solo en resize.
- Eliminar `shadowBlur` en bucle de partículas (F3 lo reemplaza).
- Mantener la lógica de rAF dormido; presupuesto: 60fps en móvil medio, DPR cap 2 (ya existe).

### F7 — QA
- `prefers-reduced-motion`: sin cambios (marca estática, ya cubierto).
- Verificar light/dark (`--ink`/`--accent` se leen en runtime, ok).
- Móvil: densidad 0.55 ya aplicada; comprobar que órbitas+elipse no invaden el texto (cy = 0.12H).
- `/build-check` + medición de fps con DevTools.

## Orden y esfuerzo

| Fase | Impacto | Esfuerzo | Archivos |
|---|---|---|---|
| F1 órbitas | ★★★ | S | `hero.js` |
| F2 profundidad | ★★★ | M | `hero.js` |
| F3 cometa | ★★ | M | `hero.js` |
| F4 micro-vida | ★ | S | `hero.js` |
| F5 física | ★ | S | `hero.js` |
| F6 perf | — (habilita el resto) | S | `hero.js` |
| F7 QA | — | S | — |

Todo vive en `js/scroll/hero.js`; cero cambios en HTML/CSS salvo ajuste fino opcional de `--hp`.
