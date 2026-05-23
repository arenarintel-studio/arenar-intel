// ── AMBIENT DATA INITIALIZATION ───────────────────────

const hamburgerBtn = document.getElementById("hamburgerBtn");
const menuPanel = document.getElementById("menuPanel");
const closeBtn = document.getElementById("closeBtn");
const menuOverlay = document.getElementById("menuOverlay");

const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");
const clearBtn = document.querySelector(".clear-search");
const searchBtn = document.querySelector(".icon");
const searchForm = document.getElementById("searchForm");

const menuNav = document.querySelector(".menu-nav");
const menuFooter = document.querySelector(".menu-footer");

const backToTopBtn = document.getElementById("backToTop");
const shareBtn = document.querySelector(".share-btn");

let searchLibrary = null;

// ── BROWSER INPUT HARDENING ───────────────────────────

if (searchInput) {
  searchInput.setAttribute("autocomplete", "new-password");
  searchInput.setAttribute("autocorrect", "off");
  searchInput.setAttribute("autocapitalize", "off");
  searchInput.setAttribute("spellcheck", "false");
  searchInput.setAttribute("data-form-type", "other");
}

if (searchForm) {
  searchForm.setAttribute("autocomplete", "off");
}

// ── SEARCH STATE ──────────────────────────────────────

function hideMenuElements() {
  if (menuNav) menuNav.style.display = "none";
  if (menuFooter) menuFooter.style.display = "none";
}

function restoreMenuElements() {
  if (menuNav) menuNav.style.display = "";
  if (menuFooter) menuFooter.style.display = "";
}

function resetSearchState() {
  if (searchInput) {
    searchInput.value = "";
    searchInput.blur();
  }

  if (searchResults) {
    searchResults.innerHTML = "";
  }

  restoreMenuElements();
}

// ── MENU CONTROLS ─────────────────────────────────────

function openMenu() {
  if (!menuPanel || !menuOverlay || !hamburgerBtn || !closeBtn) return;

  resetSearchState();

  menuPanel.classList.add("open");
  menuOverlay.classList.add("active");

  hamburgerBtn.classList.add("hide-icon");
  closeBtn.classList.add("show-close");

  // Prevent background scroll without layout glitches
  document.documentElement.classList.add("menu-is-open");
}

function closeMenu() {
  if (!menuPanel || !menuOverlay || !hamburgerBtn || !closeBtn) return;

  if (searchInput) {
    searchInput.blur();
  }

  menuPanel.classList.remove("open");
  menuOverlay.classList.remove("active");

  hamburgerBtn.classList.remove("hide-icon");
  closeBtn.classList.remove("show-close");

  document.documentElement.classList.remove("menu-is-open");

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

document.querySelectorAll(".menu-nav a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuPanel?.classList.contains("open")) {
    closeMenu();
  }
});

if (menuPanel) {
  menuPanel.addEventListener("click", (e) => {
    if (
      searchInput &&
      e.target !== searchInput &&
      !searchInput.contains(e.target)
    ) {
      searchInput.blur();
    }
  });
}

// ── BACK TO TOP ───────────────────────────────────────

if (backToTopBtn) {
  backToTopBtn.addEventListener("click", (e) => {
    e.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ── SHARE ARTICLE ─────────────────────────────────────

async function shareArticle() {
  const shareData = {
    title: document.title,
    url: window.location.href
  };

  try {
    // Native mobile / desktop sharing
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    // Clipboard fallback
    await navigator.clipboard.writeText(window.location.href);

    if (!shareBtn) return;

    const shareText = shareBtn.querySelector("span");

    if (!shareText) return;

    const originalText = shareText.textContent;

    shareText.textContent = "Copied!";

    setTimeout(() => {
      shareText.textContent = originalText;
    }, 1500);

  } catch (err) {
    console.error("Share failed:", err);
  }
}

if (shareBtn) {
  shareBtn.addEventListener("click", shareArticle);
}

// ── PAGEFIND SEARCH ───────────────────────────────────

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
    console.error("Pagefind failed to load:", error);
    return;
  }

  function routeToPage(url) {
    closeMenu();

    requestAnimationFrame(() => {
      window.location.href = url;
    });
  }

  let searchToken = 0;

  async function processSearch(query, isLive) {

    if (!searchLibrary) return;

    const currentToken = ++searchToken;

    // Hide keyboard only on actual submit
    if (!isLive) {
      searchInput.blur();
    }

    if (query.length < 2) {
      searchResults.innerHTML = "";

      if (!isLive) {
        restoreMenuElements();
      }

      return;
    }

    try {

      const searchExecution = await searchLibrary.search(query);

      // Prevent stale race-condition results
      if (currentToken !== searchToken) return;

      // Prevent results after menu closes
      if (!menuPanel.classList.contains("open")) return;

      const rawResults = isLive
        ? searchExecution.results.slice(0, 3)
        : searchExecution.results;

      const results = await Promise.all(
        rawResults.map((r) => r.data())
      );

      if (currentToken !== searchToken) return;

      searchResults.innerHTML = "";

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

        card.className =
          index === 0
            ? "search-result-item recommended"
            : "search-result-item";

        const title = article.meta.title || "Untitled";
        const excerpt = article.excerpt || "";

        if (index === 0) {

          card.innerHTML = `
            <div class="recommended-label">RECOMMENDED</div>

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

  // ── SEARCH EVENTS ──────────────────────────────────

  searchInput.addEventListener("focus", () => {

    if (searchInput.value.trim().length > 0) {
      hideMenuElements();
    } else {
      restoreMenuElements();
    }
  });

  searchInput.addEventListener("input", () => {

    const query = searchInput.value.trim();

    if (query.length > 0) {

      hideMenuElements();

      processSearch(query, true);

    } else {

      searchResults.innerHTML = "";

      restoreMenuElements();
    }
  });

  searchInput.addEventListener("blur", () => {

    setTimeout(() => {

      if (
        searchInput.value.trim().length === 0 &&
        document.activeElement !== searchInput
      ) {

        searchResults.innerHTML = "";

        restoreMenuElements();
      }

    }, 150);
  });

  // ── SUBMIT SEARCH ──────────────────────────────────

  if (searchForm) {

    searchForm.addEventListener("submit", (e) => {

      e.preventDefault();

      processSearch(
        searchInput.value.trim(),
        false
      );
    });
  }

  searchInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

      e.preventDefault();

      processSearch(
        searchInput.value.trim(),
        false
      );
    }
  });

  searchBtn.addEventListener("click", (e) => {

    e.preventDefault();

    processSearch(
      searchInput.value.trim(),
      false
    );
  });

  clearBtn.addEventListener("click", () => {
    resetSearchState();
  });

});