# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

쇼츠박스(ShortsBox) — 여행지별 유튜브 꿀템 쇼츠를 큐레이션하고, 영상 속 아이템의 구매처(제휴 링크)를 연결해주는 사이트. Plain HTML/CSS/JS static site (no framework, no bundler, no build step) deployed on Vercel, backed by Supabase (Postgres + one Edge Function).

## Commands

- `npm run generate` — regenerates all static pages (`travel/{slug}/`, `watch/{youtubeId}/`, `ranking/`, `ranking/{slug}/`, `sitemap.xml`) by fetching current data from Supabase. Run this after editing anything that feeds into the static templates (destination guides, affiliate links, video notes, the generator script itself).
- `npm run generate:og-image` / `npm run generate:card-news` — one-off asset generation scripts (OG images, social card news), not part of normal dev loop.
- No test suite, no linter, no bundler. Verify changes by running the generator and opening the affected pages in a browser.
- Local preview: `.claude/launch.json` defines a `static-site` config (Python `http.server`). **Caching is aggressive** — after editing CSS/JS, bump the port number in `launch.json` before previewing again or you'll see stale assets.

## Architecture

**Two independent renderers for the same pages — this is the thing most likely to bite you.**
Destination and video pages exist in two forms that must be kept in sync manually:
1. Client-side: `detail.html`/`video.html` (legacy `?id=`/`?v=` URLs) hydrated by `js/detail-page.js`/`js/video-page.js`, which fetch straight from Supabase via `js/supabase-client.js` + `js/data.js`.
2. Pre-baked static HTML: `scripts/generate-static-pages.js` (Node) generates `travel/{slug}/index.html` and `watch/{youtubeId}/index.html` with content already inlined, so crawlers that don't execute JS (most AI/SEO bots) still see real content. Canonical URLs point here; the client JS re-hydrates on top for interactivity (save/share buttons, related grids).

Any shared UI change (a new content block, a new affiliate CTA, reordering sections) has to be made in **both** places: the relevant `js/*-page.js` render function and the matching function in `scripts/generate-static-pages.js`. They are two separate template implementations, not one shared component.

**Shared data modules are dual-context.** `js/destination-guides.js`, `js/affiliate-config.js`, `js/video-notes.js`, `js/slugs.js` all end with `if (typeof module !== 'undefined') module.exports = {...}`, because they're loaded both as browser `<script>` tags and via Node `require()` from `generate-static-pages.js`. Keep new exports in that guard.

**Data pipeline:**
- `supabase/functions/fetch-shorts` (Edge Function) runs on a daily `pg_cron` (04:00 UTC) — pulls YouTube Data API shorts per destination into the `shorts` table, using a whitelist filter (must show item/맛집 signal) rather than a blocklist. It also refreshes view counts for curated videos separately (`refreshCuratedStats`), because the collection loop deliberately skips them to avoid deleting them — without that separate pass their view counts freeze at curation time and the ranking pages sort by stale numbers.
- **Verifying the cron actually works is not obvious.** `cron.job_run_details` reporting `succeeded` only means the HTTP request was queued, not that the function ran — a misconfigured `Authorization` header fails silently there. This bit us once: the job ran daily for 15 days while every call returned 401, and nothing surfaced it. To actually check: `select id, status_code, created, left(coalesce(content, error_msg, ''), 200) from net._http_response order by created desc limit 5;` and `select max(fetched_at) from shorts;` (should be within a day). Also note `net.http_post` defaults to a 5s timeout, which this function always exceeds — it still completes, but the response never gets logged, so set `timeout_milliseconds` explicitly.
- **Re-running the collection by hand is not free.** YouTube enforces a `Search Queries per day` limit that is *separate* from the 10,000 unit/day budget, and one full run costs one search per destination (two when the city-name search comes up empty and it falls back to the country name). A few manual re-runs in one day exhaust it, and every destination then reports zero candidates — which looks exactly like "the search terms are wrong". `videos.list` is not billed against that metric, so `refreshCuratedStats` keeps succeeding while every search fails. The quota window resets at midnight US Pacific (07:00 UTC / 16:00 KST), *not* at the 04:00 UTC cron time. `throwIfApiError` now surfaces the API's own reason string in the per-destination result, so check that before blaming a query.
- `products` table (per-video curated purchase items) is **never auto-populated** — it's curated manually per video (see the `/watch` skill workflow for reviewing shorts frame-by-frame). Curated products deliberately use generic category names (`coupang_url` usually empty, falls back to a Coupang search by `name`) rather than the exact branded item shown in the video — this is intentional, not a gap, to avoid capturing revenue the original creator would have earned from their own recommendation.
- `.github/workflows/generate-static-pages.yml` runs `npm run generate` daily at 04:37 UTC (after the Supabase cron) and auto-commits/pushes if `travel/`, `watch/`, or `sitemap.xml` changed. Pull before pushing to this repo to avoid conflicting with this bot's commits. The odd minute is deliberate — GitHub's shared runners delay schedules clustered on the hour or half-hour, and this job was routinely firing 6+ hours late when set to `30 4`.

**Adding a destination** touches four places, and missing any one fails silently rather than loudly:
1. `destinations` table in Supabase (id, name, country, emoji).
2. `DESTINATION_SLUGS` in `js/slugs.js` — without it the URL falls back to `/travel/id-{n}/`.
3. `DESTINATION_GUIDES` in `js/destination-guides.js` — optional for the page to build, but this is the only real text on the page, so skipping it means the page has nothing for search engines to rank.
4. `assets/destinations/{slug}.jpg` **plus** the slug in `DESTINATIONS_WITH_PHOTO` (`js/slugs.js`). Without a photo, leave the slug out of that list and `coverStyle()` returns an empty string so the card falls back to the brand gradient. Setting `--cover-photo` to a missing file does *not* fall back — it just renders a broken, washed-out cover.

Shorts are then collected automatically by the next daily cron run; to populate immediately, re-run the Edge Function (see `supabase/cron.sql` notes).

**Affiliate CTA placement pattern.** New affiliate integrations should be embedded as a `cta: { label, url }` field inside a matching entry of a destination's `sections` array in `js/destination-guides.js` (e.g. USIMSA under the "유심·데이터" section, Trip.com trains under "이동은 이렇게 하면 편해요") — the rendering (`renderGuideBlockHtml` client-side, `guideBlockHtml` in the generator) already handles `sec.cta` generically, no new render code needed. Only fall back to a standalone banner (`.agoda-banner` pattern) when there's no destination-guide section that actually matches the product category (accommodation, activities) — and even then, **always render the banner's container div even when there's no link for that destination**; a conditionally-omitted container will cause the client JS to throw on `getElementById(...).innerHTML = ...` for destinations without that link, silently breaking hydration for the rest of the page.

**XSS note:** shorts titles/channel names come from the YouTube API (external, unescaped). Any client-side rendering path that puts DB-sourced text into `innerHTML` must wrap it in `escapeHtml()` (`js/utils.js`). The static generator already does this consistently; the client render paths are where this has been missed before.

**Design tokens:** `css/tokens.css` defines `--grad` (the brand violet→coral→gold gradient) and font stack (`Cafe24 Ssurround` display font, imported via CDN in `css/base.css`, not self-hosted). Gradient-background sections use `linear-gradient(var(--scrim),var(--scrim)),var(--grad)` (a 30% black scrim) for WCAG contrast — don't put white text directly on `--grad` without it.

**Filename gotcha:** files matching common ad-blocker patterns get silently blocked client-side. `home.js`/`pages.css` were renamed to `home-page.js`/`pagestyles.css` for this reason — avoid `ad`, `ads`, `home`, `banner` in new filenames.

**No user accounts.** "Saving" destinations/videos is pure `localStorage` (`js/data.js`), no auth — this was a deliberate removal, not unfinished work.
