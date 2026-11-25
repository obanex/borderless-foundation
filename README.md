# Borderless Foundation website

Bilingual (English / French) website for the Borderless Foundation and its flagship entity, Borderless Opportunities.

- **Live site:** https://obanex.github.io/borderless-foundation/
- **Admin:** https://obanex.github.io/borderless-foundation/admin/ (see [ADMIN-GUIDE.md](ADMIN-GUIDE.md))

## How it works

It is a static site with no build step, hosted on GitHub Pages.

```
index.html            the website (single page, hash routes like #/opportunities)
assets/load.js        loads content/*.json, then starts the app
assets/app.js         core + Foundation pages (home, growth, services, ecosystem, advertise, contact)
assets/opportunities.js  Borderless Opportunities (hub, scholarship guides, open calls, toolkit, laureates, insights, search)
assets/styles.css     design
content/              ALL editable content, as JSON (edited from /admin)
  settings.json       links, default language, form service
  text/en.json, fr.json  interface text
  scholarships.json, calls.json, toolkit.json, laureates.json, articles.json, downloads.json, foundation.json
uploads/              files uploaded from the admin
admin/                the admin app (config.js, schema.js, admin.js, admin.css)
```

The admin signs in with a GitHub fine-grained access key (Contents: read and write on this repository). Each save commits the changed JSON file through the GitHub API, and GitHub Pages redeploys the site automatically.

- To add an editable field, add it to the content JSON and describe it in `admin/schema.js`.
- If the repository is renamed or moved, update `admin/config.js`.

## Run it locally

The content is loaded with `fetch`, so the site must be served over http:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Content notes

- Laureate portraits shipped with the site are **example profiles** (fictional, tagged on the site). Replace them with real laureates who agreed to be featured.
- Open calls are sample listings. Scholarship guides describe real programmes in general terms; check the official pages each season.
