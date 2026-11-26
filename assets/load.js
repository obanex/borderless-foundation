/*
 * Loads the site content (content/*.json, edited from /admin), then starts the app.
 * The pages need to be served over http(s); opening index.html as a file won't work.
 */
(function () {
  "use strict";

  const FILES = {
    settings: "content/settings.json",
    en: "content/text/en.json",
    fr: "content/text/fr.json",
    calls: "content/calls.json",
    articles: "content/articles.json",
    downloads: "content/downloads.json",
    foundation: "content/foundation.json",
    scholarships: "content/scholarships.json",
    toolkit: "content/toolkit.json",
    laureates: "content/laureates.json",
    translation: "content/translation.json"
  };
  const SCRIPTS = ["assets/app.js", "assets/opportunities.js", "assets/translation.js"];

  // "no-cache" still uses the browser cache but checks for a newer version first,
  // so edits made in the admin show up as soon as the site has redeployed.
  const getJson = (path) => fetch(path, { cache: "no-cache" }).then((res) => {
    if (!res.ok) throw new Error(path + " (" + res.status + ")");
    return res.json();
  });

  const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(src));
    document.body.appendChild(s);
  });

  async function start() {
    const keys = Object.keys(FILES);
    const values = await Promise.all(keys.map((k) => getJson(FILES[k])));
    const c = Object.fromEntries(keys.map((k, i) => [k, values[i]]));

    window.CONFIG = c.settings;
    window.I18N = { en: c.en, fr: c.fr };
    window.DATA = {
      opportunities: c.calls,
      articles: c.articles,
      downloads: c.downloads,
      entities: c.foundation.entities,
      ambassadorBenefits: c.foundation.ambassadorBenefits,
      ambassadorPath: c.foundation.ambassadorPath
    };
    window.DATA_SCHOLARSHIPS = c.scholarships;
    window.DATA_TOOLKIT = c.toolkit;
    window.DATA_LAUREATES = c.laureates;
    window.DATA_TRANSLATION = c.translation;

    for (const src of SCRIPTS) await loadScript(src);
    window.BF.boot();
  }

  start().catch((err) => {
    console.error(err);
    document.getElementById("main").innerHTML =
      '<div class="container" style="padding:96px 16px;text-align:center">' +
      "<h1>Borderless Foundation</h1>" +
      '<p class="lead" style="margin:0 auto">The site content could not be loaded. Please refresh the page in a moment.<br>' +
      "Le contenu du site n'a pas pu être chargé. Veuillez actualiser la page dans un instant.</p></div>";
  });
})();
