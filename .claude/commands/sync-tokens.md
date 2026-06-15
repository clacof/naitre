# /sync-tokens

Sincroniza la paleta de color de naitre → naitre-inventario.

## Contexto

naitre-inventario (`~/code/naitre-inventario`) replica la paleta crema/terracota de este proyecto.
Los tokens canónicos viven en `index.html` de naitre (CSS custom properties en `:root`).
En naitre-inventario los tokens se definen en:
- `src/design-tokens/primitives/index.json` — escala de color brand (terracota) + neutral
- `src/design-tokens/semantic/index.json` — tokens semánticos que referencian primitivos
- `src/app/globals.css` — CSS custom properties para Tailwind v4

## Pasos

1. Lee la paleta actual de naitre:
   ```bash
   grep -E "^\s+--" /Users/clacof/Claude/Projects/naitre/index.html | head -20
   ```

2. Compara con los valores en naitre-inventario:
   ```bash
   grep "accent\|cream\|ink\|brand" /Users/clacof/code/naitre-inventario/src/app/globals.css
   ```

3. Identifica divergencias (colores que cambiaron en naitre pero no se actualizaron en inventario).

4. Propón un diff de `globals.css` en naitre-inventario para alinear los tokens.

5. Si el usuario aprueba, aplica el cambio y reporta qué se actualizó.

## Tokens canónicos de referencia

| Variable naitre | Valor hex | Equivalente en inventario |
|---|---|---|
| `--ink` | `#191713` | `--text-primary` |
| `--cream` | `#f9f7f1` | `--bg-primary` |
| `--accent` | `#c96342` | `--accent` |
| `--accent-ink` | `#a54e32` | `--accent-dark` |
| `--slate` | `#5d7e9c` | — (no tiene equivalente, ignorar) |
| `--moss` | `#6f7d54` | — (no tiene equivalente, ignorar) |
