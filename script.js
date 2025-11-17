// search.js - robust version
document.addEventListener("DOMContentLoaded", () => {

  const pages = [
    "index.html",
    "history.html",
    "our foundations.html",
    "our team.html",
    "contact.html",
    "community.html",
    "events.html",
    "key priority areas.html",
    "partnership.html"
  ];

  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");

  // handle Enter and click
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); }});
  btn.addEventListener("click", doSearch);

  function doSearch() {
    const raw = (input.value || "").trim();
    if (!raw) return;
    const query = raw.toLowerCase();

    // Clear old highlights on current page
    document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));

    // 1) Search current page (headings & paragraphs)
    if (searchInDoc(document, query)) {
      // found locally and highlighted inside searchInDoc
      return;
    }

    // 2) If running from file://, cross-page fetches usually fail in browser.
    if (window.location.protocol === "file:") {
      alert("Cross-page search requires the site to be served from a web server. Please run a local server (e.g. VS Code Live Server) or upload your files to a webhost.");
      return;
    }

    // 3) Fetch all other pages in parallel and find first that contains the query
    const current = window.location.pathname.split("/").pop();
    const toCheck = pages.filter(p => p !== current);

    const fetchPromises = toCheck.map(p =>
      fetch(p).then(r => r.ok ? r.text().then(html => ({ page: p, html })) : Promise.reject(new Error(`Status ${r.status}`)))
      .catch(err => ({ page: p, error: err }))
    );

    Promise.allSettled(fetchPromises).then(results => {
      for (let res of results) {
        // each res.value is either {page, html} or {page, error}
        if (res.status === "fulfilled") {
          const data = res.value;
          if (data && data.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.html, "text/html");
            if (searchInDoc(doc, query, /*dryRun=*/true)) {
              // redirect to that page with query param so it highlights on load
              window.location.href = `${data.page}?search=${encodeURIComponent(query)}`;
              return;
            }
          }
        } else if (res.status === "rejected") {
          // Sometimes an inner promise rejected; try to read its reason
          const val = res.reason || res.value;
          console.warn("Fetch promise rejected for a page:", val);
        }
      }

      // If we reach here, no results anywhere
      alert("No matching content found.");
    });
  }

  // searchInDoc: searches headings and paragraphs inside a Document (or element).
  // If dryRun === false it also highlights & scrolls. If dryRun === true it only returns boolean.
  function searchInDoc(docLike, query, dryRun = false) {
    const tags = ["h1","h2","h3","h4","h5","h6","p"];
    const nodes = [];
    tags.forEach(t => nodes.push(...Array.from((docLike.querySelectorAll ? docLike.querySelectorAll(t) : docLike.getElementsByTagName(t)))));

    let found = false;
    for (let node of nodes) {
      const text = (node.textContent || "").toLowerCase();
      if (text.includes(query)) {
        found = true;
        if (!dryRun && node.ownerDocument === document) {
          // highlight & scroll (only if searching the live document)
          node.classList.add("highlight");
          node.scrollIntoView({behavior: "smooth", block: "center"});
        }
        // If not the live document and not dryRun, we cannot highlight here; redirection will handle it.
        if (found && dryRun) break;
      }
    }
    return found;
  }

  // On page load, if redirected with ?search=term, highlight matching headings/paragraphs
  const params = new URLSearchParams(window.location.search);
  const q = params.get("search");
  if (q) {
    // small timeout to wait for page content layout, then highlight
    setTimeout(() => {
      // clear previous highlights
      document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));
      searchInDoc(document, q, /*dryRun=*/false);
    }, 300);
  }
});
// Zoom-in animation for Vision, Mission, Motto, Objectives
const zoomItems = document.querySelectorAll(".zoom-in");

function zoomInOnScroll() {
    zoomItems.forEach(item => {
        const top = item.getBoundingClientRect().top;
        const height = window.innerHeight;

        if (top < height * 0.8) {
            item.classList.add("show");
        }
    });
}

window.addEventListener("scroll", zoomInOnScroll);
window.addEventListener("load", zoomInOnScroll);



