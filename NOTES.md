# ARENAR INTEL — FRONTMATTER REFERENCE

## NEWS ARTICLE (content/intel/article-slug.md)
+++
title = "Headline under 60 characters"
date = 2026-06-26T13:30:00Z
draft = false
image = "/images/intel/descriptive-name.webp"
summary = "130-160 chars for search results and social previews"
source = "Reuters"                          # optional
author = "Seth Anokye Amoyaw"               # optional, defaults to "The Intel Desk"
learn_more = ["what-is-pfas"]               # optional → "More on This Topic" box, links to /learn/ slugs
read_next = ["some-intel-slug"]             # optional → "Read Next", links to /intel/ slugs (compact cards)
editors_pick = ["some-intel-slug"]          # optional → "Editor's Pick", links to /intel/ slugs (basic cards)
+++

## LEARN ARTICLE (content/learn/article-slug.md)
+++
title = "What is PFAS?"
draft = false
image = "/images/learn/descriptive-name.webp"
summary = "130-160 chars explaining the concept"
author = "The Intel Desk"                    # optional
+++
# NOTE: no date, no source (evergreen knowledge)

## SECTION → FIELD → CARD STYLE MAP
- "More on This Topic"  ← learn_more    → links to /learn/  → learn-more cards
- "Read Next"           ← read_next     → links to /intel/  → compact.html cards
- "Editor's Pick"       ← editors_pick  → links to /intel/  → basic.html cards
- All three render ONLY when the field exists. Empty/missing = section hidden.

## IMAGE STANDARD
- News images  → static/images/intel/
- Learn images → static/images/learn/
- Size: 1200 x 675 pixels, 16:9 landscape
- Format: WebP or JPG, quality 80, under 200KB
- Reference in frontmatter WITH subfolder: image = "/images/intel/filename.webp"

## KEY RULES
- Date MUST be ISO 8601 with Z:  2026-06-26T13:30:00Z
- Title under 55 chars (so " | Arenar Intel" stays under 70)
- Summary 130-160 chars max
- draft = false to publish; buildFuture is on so future-dated posts publish immediately
- Slugs in the array fields = filename without .md (e.g. "what-is-pfas" for what-is-pfas.md)
- NEVER change an article's slug/URL after publishing (creates 404s)
- NEVER delete a published article (creates 404s) — it stays live even if removed from homepage.toml

## HOMEPAGE
- Articles shown via slots in data/homepage.toml (slot_1 = "article-slug", etc.)
- To feature a new article: move it into slot_1, shift others down
- Removing from a slot only hides it from homepage — article URL still works

## SECTIONS WITH NO LISTING PAGE (intentional)
- /intel/ and /learn/ both have _index.md with:
    [build]
      render = "never"
- This stops duplicate-content listing pages. Individual articles still work.

## DEPLOYMENT
- Commit + push to GitHub → Cloudflare auto-builds
- Build command: hugo && npx pagefind --site public
- Never commit while `hugo server` is running (can put localhost URLs in sitemap)
- If CSS won't update locally: stop server, delete resources/_gen, restart with:
    hugo server --disableFastRender

## DEFERRED (build later when enough content)
- Fallback image for slow connections
- Categories/sections (wait for 30+ articles)
- /learn/ browsable listing page (wait for enough explainers)
- Filling Read Next / Editor's Pick / More on This Topic (need article volume)