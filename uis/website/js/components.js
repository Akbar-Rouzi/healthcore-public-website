/**
 * Fetches header.html and footer.html.
 * Inserts them into #header and #footer.
 * Initializes the dynamically loaded hamburger menu.
 * Highlights the current page in desktop and mobile navigation.
 */
import { initializeSharedLanguage, updateHeaderMenuLabel } from "./language/language.js";

// Load an HTML file and insert it into the page, such as the header or footer.
async function loadComponent(selector, filePath) {
    const container = document.querySelector(selector);

    if (!container) {
        throw new Error(`Component container not found: ${selector}`);
    }

    const response = await fetch(filePath);

    if (!response.ok) {
        throw new Error(
            `Unable to load ${filePath}: ${response.status} ${response.statusText}`,
        );
    }

    container.innerHTML = await response.text();
}

// Set up opening and closing the mobile menu, including closing it with Escape.
function initializeMobileMenu() {
    const menuButton = document.getElementById("menu-button");
    const mobileMenu = document.getElementById("mobile-menu");

    if (!menuButton || !mobileMenu) {
        return;
    }

    menuButton.addEventListener("click", () => {
        const isOpen = menuButton.getAttribute("aria-expanded") === "true";

        menuButton.setAttribute("aria-expanded", String(!isOpen));
        updateHeaderMenuLabel();

        mobileMenu.classList.toggle("hidden", isOpen);
    });

    document.addEventListener("keydown", (event) => {
        const isOpen = menuButton.getAttribute("aria-expanded") === "true";

        if (event.key === "Escape" && isOpen) {
            menuButton.click();
            menuButton.focus();
        }
    });
}

// Convert a path such as /services.html to services so page paths are easy to compare.
function normalizePagePath(path) {
    const page = path.split("/").pop() || "index";

    return page.replace(".html", "");
}

// Highlight the navigation link for the page the user is viewing.
function highlightCurrentPage() {
    const currentPage = normalizePagePath(window.location.pathname);
    const navigationLinks = document.querySelectorAll("[data-nav-link]");

    navigationLinks.forEach((link) => {
        const linkPage = normalizePagePath(link.getAttribute("href"));

        link.classList.remove(
            "text-navy",
            "border-b-2",
            "border-navy",
            "bg-cloud",
        );

        link.removeAttribute("aria-current");

        if (linkPage !== currentPage) {
            return;
        }

        link.classList.add("text-navy");
        link.setAttribute("aria-current", "page");

        if (link.closest("#mobile-menu")) {
            link.classList.add("bg-cloud");
        } else {
            link.classList.add("border-b-2", "border-navy");
        }
    });
}

// Load the header and footer, then set up language switching, the menu, navigation, and icons.
async function initializeComponents() {
    try {
        await Promise.all([
            loadComponent("#header", "./components/header.html"),
            loadComponent("#footer", "./components/footer.html"),
        ]);

        if (document.getElementById("patient-enquiry")) {
            await import("./application.js");
        }
        if (document.getElementById("clinic-status")) {
            await import("./locations.js");
        }

        initializeSharedLanguage();
        initializeMobileMenu();
        highlightCurrentPage();

        if (window.lucide) {
            lucide.createIcons();
        }
        document.dispatchEvent(new Event("pageready"));
    } catch (error) {
        console.error("Unable to initialize shared components:", error);
        document.dispatchEvent(new Event("pageerror"));
    }
}

initializeComponents();
