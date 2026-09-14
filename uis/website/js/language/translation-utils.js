import { translationDictionary } from "./translation-dictionary.js";

// Find marked elements inside a component and translate their text and marked attributes.
export function applyTranslations(component, language) {
    component.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = getTranslationWithFallback(element.dataset.i18n, language);
    });
    for (const attribute of ["aria-label", "placeholder", "title"]) {
        component.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
            element.setAttribute(attribute, getTranslationWithFallback(element.getAttribute(`data-i18n-${attribute}`), language));
        });
    }
}

// Look up one translation, falling back to English or the key if it is missing.
export function getTranslationWithFallback(key, language = "en") {
    // The first dot separates the group from its key: header.nav.home → header["nav.home"].
    const separator = key.indexOf(".");
    if (separator === -1) return key;
    const group = key.slice(0, separator);
    const translationKey = key.slice(separator + 1);
    return translationDictionary[language]?.[group]?.[translationKey]
        ?? translationDictionary.en[group]?.[translationKey]
        ?? key;
}
