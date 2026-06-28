// Integración opcional con el servicio central naitre-auth.
// La landing es pública; esto solo añade conciencia de sesión (mostrar "Entrar"
// o "Mi cuenta") y permite proteger zonas concretas si las hubiera.
//
// Uso en index.html:
//   <script type="module">
//     import { initNaitreAuth } from "./auth.js";
//     initNaitreAuth();
//   </script>
//
// Para PROTEGER una página concreta (no la landing):
//   import { requireSession } from "./auth.js";
//   await requireSession("web");   // redirige al login si no hay acceso

import {
  naitreSession,
  hasProduct,
} from "http://localhost:4000/sdk/vanilla.js";

const AUTH_URL = "http://localhost:4000";

/** Marca el <body> con data-naitre-user y rellena [data-naitre-account]. */
export async function initNaitreAuth() {
  const s = await naitreSession();
  document.body.dataset.naitreUser = s.user ? s.user.email : "";
  const slot = document.querySelector("[data-naitre-account]");
  if (slot) {
    slot.innerHTML = s.user
      ? `<a href="${AUTH_URL}/">${s.user.email}</a>`
      : `<a href="${AUTH_URL}/login">Entrar</a>`;
  }
  return s;
}

/** Exige sesión + acceso a un producto; si no, redirige al login. */
export async function requireSession(productId = "web") {
  const s = await naitreSession();
  if (!s.user || !hasProduct(s, productId)) {
    location.href = `${AUTH_URL}/login`;
    return null;
  }
  return s;
}
