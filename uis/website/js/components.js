/**
 * Fetches header.html and footer.html.
 * Inserts them into #header and #footer.
 * Initializes the dynamically loaded hamburger menu.
 * Highlights the current page in desktop and mobile navigation.
 */
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

function initializeMobileMenu() {
    const menuButton = document.getElementById("menu-button");
    const mobileMenu = document.getElementById("mobile-menu");

    if (!menuButton || !mobileMenu) {
        return;
    }

    menuButton.addEventListener("click", () => {
        const isOpen = menuButton.getAttribute("aria-expanded") === "true";

        menuButton.setAttribute("aria-expanded", String(!isOpen));
        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Open navigation menu" : "Close navigation menu",
        );

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

function highlightCurrentPage() {
    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll("[data-nav-link]").forEach((link) => {
        const linkPage = link.getAttribute("href");

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

async function initializeComponents() {
    try {
        await Promise.all([
            loadComponent("#header", "./components/header.html"),
            loadComponent("#footer", "./components/footer.html"),
        ]);

        initializeMobileMenu();
        highlightCurrentPage();

        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (error) {
        console.error("Unable to initialize shared components:", error);
    }
}

initializeComponents();