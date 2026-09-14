import * as languageCatalog from "./translation-utils.js";

// Restore the saved language and set up the EN/ES button click listeners.
export function initializeSharedLanguage() {
    const header = document.querySelector("#header header");
    if (!header) return;

    let savedLanguage = "en";
    try {
        if (localStorage.getItem("healthcore-header-language") === "es") savedLanguage = "es";
    } catch { /* Language switching also works when storage is disabled. */ }
    applyLanguage(savedLanguage, header);

    header.querySelectorAll("[data-language]").forEach((button) => {
        button.addEventListener("click", () => {
            const language = button.dataset.language;
            applyLanguage(language, header);
            try { localStorage.setItem("healthcore-header-language", language); } catch { /* Optional persistence. */ }
        });
    });
}

// Translate the header and footer and highlight the selected EN/ES button.
function applyLanguage(language, header) {
    // Mark only the translated components with the selected language.
    document.querySelectorAll("#header header, #footer footer").forEach((component) => {
        component.lang = language;
        languageCatalog.applyTranslations(component, language);
    });
    header.querySelectorAll("[data-language]").forEach((button) => {
        const selected = button.dataset.language === language;
        button.setAttribute("aria-pressed", String(selected));
        button.classList.toggle("bg-navy", selected);
        button.classList.toggle("text-white", selected);
        button.classList.toggle("text-slate-600", !selected);
    });
    updateHeaderMenuLabel();
}

// Update the menu button's screen-reader label for its state and selected language.
export function updateHeaderMenuLabel() {
    const header = document.querySelector("#header header");
    const button = document.getElementById("menu-button");
    if (!header || !button) return;
    const state = button.getAttribute("aria-expanded") === "true" ? "close" : "open";
    button.setAttribute("aria-label", languageCatalog.getTranslationWithFallback(`header.menu.${state}`, header.lang || "en"));
}
