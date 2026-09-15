import { translationDictionary } from "./translation-dictionary.js";

// Find marked elements inside a component and translate their text and marked attributes.
export function applyTranslations(component, language) {
    component.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = getTranslationWithFallback(element.dataset.i18n, language);
    });
    for (const attribute of ["aria-label", "placeholder", "title", "alt", "content"]) {
        component.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
            element.setAttribute(attribute, getTranslationWithFallback(element.getAttribute(`data-i18n-${attribute}`), language));
        });
    }
}

// Look up one translation, falling back to English or the key if it is missing.
export function getTranslationWithFallback(key, language = "en") {
    return findTranslation(translationDictionary[language], key)
        ?? findTranslation(translationDictionary.en, key)
        ?? key;
}

// Support both dotted keys ("nav.home") and nested objects (application.validation).
function findTranslation(dictionary, key) {
    if (!dictionary || typeof dictionary !== "object") return undefined;
    if (Object.hasOwn(dictionary, key) && typeof dictionary[key] === "string") {
        return dictionary[key];
    }
    const separator = key.indexOf(".");
    if (separator === -1) return undefined;
    const group = key.slice(0, separator);
    if (!Object.hasOwn(dictionary, group)) return undefined;
    return findTranslation(dictionary[group], key.slice(separator + 1));
}
