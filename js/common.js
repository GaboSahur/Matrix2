/**
 * common.js
 * -----------------------------------------------------------
 * Lógica compartida por todas las páginas:
 *  - Inyecta el nombre de marca desde config.js
 *  - Controla el menú de navegación en mobile
 *  - Marca el link activo según la página actual
 *  - Escribe el año actual en el footer
 * -----------------------------------------------------------
 */
document.addEventListener("DOMContentLoaded", () => {
  aplicarMarca();
  marcarLinkActivo();
  activarMenuMobile();
  escribirAnioFooter();
});

function aplicarMarca() {
  document.querySelectorAll("[data-brand-name]").forEach((el) => {
    el.textContent = APP_CONFIG.BRAND_NAME;
  });
  document.querySelectorAll("[data-brand-tag]").forEach((el) => {
    el.textContent = APP_CONFIG.BRAND_TAG;
  });

  // Si la página definió un título base en data-title-suffix, lo combinamos
  const suffix = document.body.dataset.titleSuffix;
  if (suffix) {
    document.title = `${suffix} · ${APP_CONFIG.BRAND_NAME}`;
  }
}

function marcarLinkActivo() {
  const paginaActual = document.body.dataset.page;
  if (!paginaActual) return;

  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.dataset.page === paginaActual) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function activarMenuMobile() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const abierto = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(abierto));
  });
}

function escribirAnioFooter() {
  const el = document.querySelector("[data-current-year]");
  if (el) el.textContent = new Date().getFullYear();
}
