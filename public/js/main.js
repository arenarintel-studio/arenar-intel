// ── AMBIENT DATA INITIALIZATION ───────────────────────

const hamburgerBtn = document.getElementById("hamburgerBtn");
const menuPanel = document.getElementById("menuPanel");
const closeBtn = document.getElementById("closeBtn");
const menuOverlay = document.getElementById("menuOverlay");

const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");

const clearBtn = document.querySelector(".clear-search");
const searchBtn = document.querySelector(".icon");

const menuNav = document.querySelector(".menu-nav");
const menuFooter = document.querySelector(".menu-footer");

let searchLibrary = null;

// ── SEARCH STATE ──────────────────────────────────────

function resetSearchState() {
  if (searchInput) {
    searchInput.value = "";
  }

  if (searchResults) {
    searchResults.innerHTML = "";
  }

  restoreMenuElements();
}

function hideMenuElements() {
  if (menuNav) {
    menuNav.style.display = "none";
  }

  if (menuFooter) {
    menuFooter.style.display = "none";
  }
}

function restoreMenuElements() {
  if (menuNav) {
    menuNav.style.display = "";
  }

  if (menuFooter) {
    menuFooter.style.display = "";
  }
}

// ── MENU CONTROLS ─────────────────────────────────────

function openMenu() {
  if (!menuPanel || !menuOverlay || !hamburgerBtn || !closeBtn) {
    return;
  }

  resetSearchState();

  menuPanel.classList.add("open");
  menuOverlay.classList.add("active");

  hamburgerBtn.classList.add("hide-icon");
  closeBtn.classList.add("show-close");

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  restoreMenuElements();
}

function closeMenu() {
  if (!menuPanel || !menuOverlay || !hamburgerBtn || !closeBtn) {
    return;
  }

  menuPanel.classList.remove("open");
  menuOverlay.classList.remove("active");

  hamburgerBtn.classList.remove("hide-icon");
  closeBtn.classList.remove("show-close");

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";

  resetSearchState();
}

if (hamburgerBtn) {
  hamburgerBtn.addEventListener("click", openMenu);
}

if (closeBtn) {
  closeBtn.addEventListener("click", closeMenu);
}

if (menuOverlay) {
  menuOverlay.addEventListener("click", closeMenu);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeMenu();
  }
});

document.querySelectorAll(".menu-nav a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

// ── ARTICLE ACTIONS ───────────────────────────────────

function shareArticle() {
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}

window.shareArticle = shareArticle;

// ── PAGEFIND ──────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {
  if (
    !searchInput ||
    !searchResults ||
    !clearBtn ||
    !searchBtn
  ) {
    return;
  }

  try {
    searchLibrary = await import("/pagefind/pagefind.js");
  } catch (error) {
    console.error("Pagefind failed to load.");
    return;
  }

  function routeToPage(url) {
    closeMenu();

    requestAnimationFrame(() => {
      window.location.href = url;
    });
  }

  async function executeExplicitSearch() {
    const query = searchInput.value.trim();

    searchResults.innerHTML = "";

    if (query.length < 2) {
      restoreMenuElements();
      return;
    }

    try {
      const searchExecution = await searchLibrary.search(query);

      const results = await Promise.all(
        searchExecution.results
          .slice(0, 5)
          .map((r) => r.data())
      );

      if (results.length === 0) {
        const emptyState = document.createElement("div");

        emptyState.className = "no-search-results";

        emptyState.textContent = `No results found for "${query}"`;

        searchResults.appendChild(emptyState);

        return;
      }

      const listContainer = document.createElement("div");

      listContainer.className = "search-results-list";

      results.forEach((article, index) => {
        const card = document.createElement("div");

        if (index === 0) {
          card.className =
            "search-result-item recommended";
        } else {
          card.className = "search-result-item";
        }

        const title =
          article.meta.title || "Untitled";

        const excerpt =
          article.excerpt || "";

        if (index === 0) {
          card.innerHTML = `
            <div class="recommended-label">
              RECOMMENDED
            </div>

            <div class="search-title">
              ${title}
            </div>

            <div class="search-excerpt">
              ${excerpt}
            </div>
          `;
        } else {
          card.innerHTML = `
            <div class="search-title">
              ${title}
            </div>

            <div class="search-excerpt secondary">
              ${excerpt}
            </div>
          `;
        }

        card.addEventListener("click", () => {
          routeToPage(article.url);
        });

        listContainer.appendChild(card);
      });

      searchResults.appendChild(listContainer);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  // ── SEARCH FIELD EVENTS ────────────────────────────

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length > 0) {
      hideMenuElements();
    } else {
      restoreMenuElements();
    }
  });

  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim().length > 0) {
      hideMenuElements();
    } else {
      searchResults.innerHTML = "";

      restoreMenuElements();
    }
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (searchInput.value.trim().length === 0) {
        searchResults.innerHTML = "";

        restoreMenuElements();
      }
    }, 150);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      executeExplicitSearch();
    }
  });

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();

    executeExplicitSearch();
  });

  clearBtn.addEventListener("click", () => {
    resetSearchState();
  });
});