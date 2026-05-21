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
const searchForm = document.getElementById("searchForm");

let searchLibrary = null;

// ── BROWSER BUG PREVENTION ────────────────────────────

if (searchInput) {
  // "new-password" is a developer trick. It forces the browser to treat 
  // this as a secure, non-historical field so it stops suggesting past searches.
  searchInput.setAttribute("autocomplete", "new-password"); 
  searchInput.setAttribute("autocorrect", "off");
  searchInput.setAttribute("autocapitalize", "off");
  searchInput.setAttribute("spellcheck", "false");
  searchInput.setAttribute("data-form-type", "other"); // Extra layer of prevention
}
if (searchForm) {
  searchForm.setAttribute("autocomplete", "off");
}

// ── SEARCH STATE ──────────────────────────────────────

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

function hideMenuElements() {
  if (menuNav) menuNav.style.display = "none";
  if (menuFooter) menuFooter.style.display = "none";
}

function restoreMenuElements() {
  if (menuNav) menuNav.style.display = "";
  if (menuFooter) menuFooter.style.display = "";
}

// ── MENU CONTROLS ─────────────────────────────────────

function openMenu() {
  if (!menuPanel || !menuOverlay || !hamburgerBtn || !closeBtn) return;

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
  if (!menuPanel || !menuOverlay || !hamburgerBtn || !closeBtn) return;

  if (searchInput) {
    searchInput.blur();
    searchInput.disabled = true; 
    setTimeout(() => { searchInput.disabled = false; }, 50);
  }

  menuPanel.classList.remove("open");
  menuOverlay.classList.remove("active");

  hamburgerBtn.classList.remove("hide-icon");
  closeBtn.classList.remove("show-close");

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";

  resetSearchState();
}

if (hamburgerBtn) hamburgerBtn.addEventListener("click", openMenu);
if (closeBtn) closeBtn.addEventListener("click", closeMenu);
if (menuOverlay) menuOverlay.addEventListener("click", closeMenu);

if (menuPanel) {
  menuPanel.addEventListener("click", (e) => {
    if (searchInput && e.target !== searchInput && !searchInput.contains(e.target)) {
      searchInput.blur();
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuPanel && menuPanel.classList.contains("open")) {
    closeMenu();
  }
});

document.querySelectorAll(".menu-nav a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

// ── ARTICLE ACTIONS ───────────────────────────────────

function shareArticle() {
  if (navigator.share) {
    navigator.share({ title: document.title, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}

window.shareArticle = shareArticle;

// ── PAGEFIND ──────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {
  if (!searchInput || !searchResults || !clearBtn || !searchBtn) return;

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

  let searchToken = 0; // Prevents old searches from overriding new ones when typing fast

  // isLive = true means user is currently typing. isLive = false means they hit enter/submit.
  async function processSearch(query, isLive) {
    if (!searchLibrary) return;

    const currentToken = ++searchToken;

    // Only blur (hide keyboard) if they actually submitted the search
    if (!isLive) {
      searchInput.blur();
    }

    if (query.length < 2) {
      searchResults.innerHTML = "";
      if (!isLive) restoreMenuElements();
      return;
    }

    try {
      const searchExecution = await searchLibrary.search(query);

      // Abort if user typed something new while we were fetching this, or menu was closed
      if (currentToken !== searchToken) return;
      if (!menuPanel.classList.contains("open")) return;

      // LIVE MODE: Slice to top 3. EXPLICIT MODE: Show all results.
      const rawResults = isLive ? searchExecution.results.slice(0, 3) : searchExecution.results;

      const results = await Promise.all(
        rawResults.map((r) => r.data())
      );

      // Check race condition again after fetching article data
      if (currentToken !== searchToken) return;

      searchResults.innerHTML = ""; // Clear out previous results

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
        card.className = index === 0 ? "search-result-item recommended" : "search-result-item";

        const title = article.meta.title || "Untitled";
        const excerpt = article.excerpt || "";

        if (index === 0) {
          card.innerHTML = `
            <div class="recommended-label">RECOMMENDED</div>
            <div class="search-title">${title}</div>
            <div class="search-excerpt">${excerpt}</div>
          `;
        } else {
          card.innerHTML = `
            <div class="search-title">${title}</div>
            <div class="search-excerpt secondary">${excerpt}</div>
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

  // Fires immediately as the user types
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    if (query.length > 0) {
      hideMenuElements();
      processSearch(query, true); // true = Live Mode (Max 3 results)
    } else {
      searchResults.innerHTML = "";
      restoreMenuElements();
    }
  });

  // Debounced blur logic to prevent UI flashing
  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (searchInput.value.trim().length === 0 && document.activeElement !== searchInput) {
        searchResults.innerHTML = "";
        restoreMenuElements();
      }
    }, 150);
  });

  // ── EXPLICIT SUBMISSIONS (Pressing Enter or clicking the Search button) ──

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      processSearch(searchInput.value.trim(), false); // false = Explicit Mode (All results)
    });
  }

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      processSearch(searchInput.value.trim(), false);
    }
  });

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    processSearch(searchInput.value.trim(), false);
  });

  clearBtn.addEventListener("click", () => {
    resetSearchState();
  });
});