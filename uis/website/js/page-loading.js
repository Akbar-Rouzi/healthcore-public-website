/*
 * Controls the loading screen while shared components and translations initialize.
 * Restores the saved English/Spanish preference for loading and error messages.
 * Reveals the page on "pageready"; shows an error and Retry link on "pageerror"
 * or after 15 seconds. Runs independently of translation modules so failures in
 * those modules can still be reported. Page content is translated elsewhere.
 */
(() => {
    const root = document.documentElement;
    let language = "en";
    try {
        if (localStorage.getItem("healthcore-header-language") === "es") language = "es";
    } catch { /* Default to English when storage is unavailable. */ }
    root.lang = language;
    let failed = false;

    function showFailure() {
        failed = true;
        root.dataset.pageState = "error";
        const status = document.getElementById("page-status");
        if (!status) return;
        status.setAttribute("role", "alert");
        const message = document.getElementById("page-status-message");
        message.querySelector('[lang="en"]').textContent = "Unable to load the page.";
        message.querySelector('[lang="es"]').textContent = "No se pudo cargar la p\u00e1gina.";
        document.getElementById("page-retry").hidden = false;
    }

    // This watchdog stays independent of modules so failed imports also show a retry.
    const timeout = setTimeout(showFailure, 15000);
    document.addEventListener("DOMContentLoaded", () => {
        if (failed) showFailure();
    }, { once: true });
    document.addEventListener("pageerror", () => {
        clearTimeout(timeout);
        showFailure();
    }, { once: true });
    document.addEventListener("pageready", () => {
        clearTimeout(timeout);
        root.dataset.pageState = "ready";
        document.getElementById("page-status")?.remove();
    }, { once: true });
})();
