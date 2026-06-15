# /build-check

Verifica que el sitio naitre no tiene errores antes de hacer push.

## Pasos

1. Comprueba que `index.html` parsea sin errores HTML obvios (tags sin cerrar, atributos mal formados).
2. Comprueba que `app.js` y `i18n.js` no tienen errores de sintaxis JS:
   ```bash
   node --input-type=module < app.js 2>&1 || true
   node --input-type=module < i18n.js 2>&1 || true
   ```
3. Revisa que todas las cadenas referenciadas en `app.js` existen en `i18n.js` (busca `t('` en app.js y verifica que cada key existe en el objeto de i18n.js).
4. Comprueba que no hay archivos >500KB en el repo raíz (excluyendo `node_modules`, `brand/`, `fonts/`):
   ```bash
   find . -maxdepth 1 -size +500k -not -name ".*" | grep -v node_modules
   ```
5. Reporta: ✓ o ✗ por cada paso, y una línea de resumen final.
