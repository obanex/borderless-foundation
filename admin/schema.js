/*
 * What the admin can edit, section by section.
 *
 * kind "list":   a list of items (add / edit / delete / reorder)
 * kind "single": one form for a whole file (or some keys of it)
 * kind "text":   the site's interface text, English and French
 *
 * Field types:
 *   id        short web address name (letters, numbers, dashes); made from the title if left empty
 *   text, textarea, url, date, number, checkbox, select, checks (several choices), tags (comma separated)
 *   bi        one line, English + French
 *   bitext    paragraph, English + French
 *   bilist    list, one item per line, English + French (paras: true → one paragraph per blank-line block)
 *   group     a repeatable group of sub-fields (e.g. calendar steps)
 *   file      a file uploaded to the site (PDF, image…)
 */
(function () {
  const LEVELS = [["bachelor", "Bachelor's / Licence"], ["master", "Master's"], ["phd", "PhD / Doctorat"]];
  const ICONS = ["file", "check", "pen", "target", "users", "trending", "compass", "link", "book", "award", "cap", "globe", "heart", "rocket", "chart", "briefcase", "calendar"]
    .map((i) => [i, i]);

  window.ADMIN_SCHEMA = [
    {
      group: "Borderless Opportunities",
      sections: [
        {
          id: "scholarships", kind: "list", file: "content/scholarships.json",
          title: "Scholarship guides", singular: "scholarship guide",
          help: "Each guide explains one scholarship programme. Items marked “Featured” appear first, and the first featured guide is shown big on the Opportunities page.",
          label: (x) => x.name, sub: (x) => (x.country && x.country.en || "") + " · " + (x.levels || []).join(", "),
          view: (x) => "#/opportunities/scholarships/" + x.id,
          fields: [
            { key: "name", type: "text", label: "Scholarship name", req: true },
            { key: "id", type: "id", label: "Web address name", from: "name" },
            { key: "featured", type: "checkbox", label: "Featured (show first)" },
            { key: "tagline", type: "bitext", label: "One-sentence summary", req: true },
            { key: "country", type: "bi", label: "Destination (as shown on the card)" },
            { key: "dest", type: "select", label: "Destination region (for filters)", options: [["europe", "Europe"], ["north-america", "North America"], ["asia", "Asia"], ["multi", "Several countries"]] },
            { key: "countries", type: "tags", label: "Country codes (for statistics)", hint: "Two-letter codes separated by commas, e.g. FR, GB. Leave empty if it varies." },
            { key: "levels", type: "checks", label: "Study levels", options: LEVELS },
            { key: "coverage", type: "select", label: "Funding", options: [["full", "Fully funded"], ["partial", "Partially funded"]] },
            { key: "link", type: "url", label: "Official website" },
            { key: "funder", type: "bi", label: "Funded by" },
            { key: "route", type: "bi", label: "How to apply (short)" },
            { key: "window", type: "bi", label: "Usual application period" },
            { key: "overview", type: "bitext", label: "What is it exactly?" },
            { key: "benefits", type: "bilist", label: "What the scholarship covers" },
            { key: "eligibility", type: "bilist", label: "Who can apply?" },
            { key: "steps", type: "bilist", label: "Applying step by step" },
            { key: "timeline", type: "group", label: "The usual calendar", item: "calendar step", fields: [
              { key: "when", type: "bi", label: "When" },
              { key: "what", type: "bi", label: "What happens" }
            ] },
            { key: "faq", type: "group", label: "Frequently asked questions", item: "question", fields: [
              { key: "q", type: "bi", label: "Question" },
              { key: "a", type: "bitext", label: "Answer" }
            ] }
          ],
          blank: () => ({ featured: false, dest: "europe", countries: [], levels: ["master"], coverage: "full", timeline: [], faq: [] })
        },
        {
          id: "calls", kind: "list", file: "content/calls.json",
          title: "Open calls", singular: "open call",
          help: "Opportunities with a deadline. They are sorted by deadline automatically and marked “Closed” once the deadline has passed.",
          label: (x) => x.title && x.title.en, sub: (x) => (x.type || "") + " · deadline " + (x.deadline || "—"),
          view: (x) => "#/opportunities/calls/" + x.id,
          fields: [
            { key: "title", type: "bi", label: "Title", req: true },
            { key: "id", type: "id", label: "Web address name", from: "title" },
            { key: "type", type: "select", label: "Type", options: [["scholarship", "Scholarship"], ["internship", "Internship"], ["training", "Training"], ["call", "Call for projects"], ["conference", "Conference"]] },
            { key: "region", type: "select", label: "Region", options: [["canada", "Canada"], ["europe", "Europe"], ["asia", "Asia"], ["caribbean", "Caribbean"], ["global", "Global"]] },
            { key: "levels", type: "checks", label: "Study levels", options: LEVELS },
            { key: "deadline", type: "date", label: "Deadline", req: true },
            { key: "published", type: "date", label: "Date published", hint: "Newest items appear first in “Latest” lists." },
            { key: "featured", type: "checkbox", label: "Featured on the home page" },
            { key: "org", type: "bi", label: "Organisation" },
            { key: "funding", type: "bi", label: "Funding (short, e.g. “Fully funded”)" },
            { key: "link", type: "url", label: "Link to apply", hint: "If empty, the button goes to your Linktree." },
            { key: "summary", type: "bitext", label: "Summary" },
            { key: "eligibility", type: "bilist", label: "Eligibility criteria" },
            { key: "benefits", type: "bilist", label: "What it covers" }
          ],
          blank: () => ({ type: "scholarship", region: "global", levels: ["master"], featured: false, published: new Date().toISOString().slice(0, 10), link: "" })
        },
        {
          id: "toolkit-docs", kind: "list", file: "content/toolkit.json", key: "docs",
          title: "Application toolkit", singular: "document guide",
          help: "One guide per application document (CV, motivation letter…).",
          label: (x) => x.title && x.title.en, sub: (x) => x.role && x.role.en,
          view: (x) => "#/opportunities/toolkit/" + x.id,
          fields: [
            { key: "title", type: "bi", label: "Title", req: true },
            { key: "id", type: "id", label: "Web address name", from: "title" },
            { key: "icon", type: "select", label: "Icon", options: ICONS },
            { key: "role", type: "bi", label: "Its role (short)" },
            { key: "intro", type: "bitext", label: "Introduction" },
            { key: "parts", type: "bilist", label: "Key parts (2–3 short words)" },
            { key: "include", type: "bilist", label: "What to include" },
            { key: "tips", type: "bilist", label: "Tips" },
            { key: "mistakes", type: "bilist", label: "Mistakes to avoid" }
          ],
          blank: () => ({ icon: "file" })
        },
        {
          id: "toolkit-collection", kind: "list", file: "content/toolkit.json", key: "collection",
          title: "Templates & resources", singular: "resource",
          help: "The numbered list of templates on the Application toolkit page. Upload a file to make it downloadable; otherwise it shows “Coming soon”.",
          label: (x) => x.title && x.title.en, sub: (x) => (x.file ? "File: " + x.file : x.route ? "Link: " + x.route : "Coming soon"),
          fields: [
            { key: "title", type: "bi", label: "Title", req: true },
            { key: "id", type: "id", label: "Short name", from: "title" },
            { key: "text", type: "bi", label: "Description" },
            { key: "file", type: "file", label: "Downloadable file" },
            { key: "route", type: "text", label: "Or: link to a page of the site", hint: "Optional, e.g. #/opportunities/scholarships" }
          ],
          blank: () => ({ file: "" })
        },
        {
          id: "laureates", kind: "list", file: "content/laureates.json",
          title: "Laureates", singular: "laureate",
          help: "Portraits of people who won a scholarship. Only publish real people who agreed to it. Untick “Example profile” for real portraits.",
          label: (x) => x.name, sub: (x) => (x.scholarship || "") + " · " + (x.year || "") + (x.sample ? " · example profile" : ""),
          view: (x) => "#/opportunities/laureates/" + x.id,
          fields: [
            { key: "name", type: "text", label: "Name", req: true },
            { key: "id", type: "id", label: "Web address name", from: "name" },
            { key: "sample", type: "checkbox", label: "Example profile (shows an “Example profile” tag)" },
            { key: "scholarship", type: "select", label: "Scholarship", options: "scholarships" },
            { key: "year", type: "number", label: "Year" },
            { key: "country", type: "bi", label: "Country" },
            { key: "programme", type: "bi", label: "Programme studied" },
            { key: "quote", type: "bitext", label: "Quote" },
            { key: "answers", type: "bilist", label: "Interview answers (3 lines, in this order)", hint: "1. How did you prepare your application? 2. What was the hardest part? 3. Your advice to future applicants?" }
          ],
          blank: () => ({ sample: false, year: new Date().getFullYear() })
        }
      ]
    },
    {
      group: "Borderless Foundation",
      sections: [
        {
          id: "articles", kind: "list", file: "content/articles.json",
          title: "Personal growth articles", singular: "article",
          label: (x) => x.title && x.title.en, sub: (x) => (x.category || "") + " · " + (x.published || ""),
          view: (x) => "#/growth/" + x.id,
          fields: [
            { key: "title", type: "bi", label: "Title", req: true },
            { key: "id", type: "id", label: "Web address name", from: "title" },
            { key: "category", type: "select", label: "Category", options: [["productivity", "Productivity & discipline"], ["career", "Direction & career"], ["tools", "Tools & applications"]] },
            { key: "minutes", type: "number", label: "Reading time (minutes)" },
            { key: "published", type: "date", label: "Date published" },
            { key: "excerpt", type: "bitext", label: "Short summary" },
            { key: "body", type: "bilist", paras: true, label: "Article text", hint: "Leave an empty line between paragraphs." }
          ],
          blank: () => ({ category: "career", minutes: 5, published: new Date().toISOString().slice(0, 10) })
        },
        {
          id: "downloads", kind: "list", file: "content/downloads.json",
          title: "Free downloads", singular: "download",
          help: "The “Free tools to download” on the Personal growth page.",
          label: (x) => x.title && x.title.en, sub: (x) => (x.file ? "File: " + x.file : "Coming soon"),
          fields: [
            { key: "title", type: "bi", label: "Title", req: true },
            { key: "id", type: "id", label: "Short name", from: "title" },
            { key: "icon", type: "select", label: "Icon", options: ICONS },
            { key: "text", type: "bi", label: "Description" },
            { key: "file", type: "file", label: "Downloadable file" }
          ],
          blank: () => ({ icon: "file", file: "" })
        },
        {
          id: "entities", kind: "list", file: "content/foundation.json", key: "entities",
          title: "Ecosystem entities", singular: "entity",
          help: "The Borderless entities shown on the Ecosystem page and the home page. Only one should be marked as flagship.",
          label: (x) => "Borderless " + x.name, sub: (x) => (x.flagship ? "Flagship · " : "") + (x.short && x.short.en || ""),
          view: (x) => "#/ecosystem?entity=" + x.id,
          fields: [
            { key: "name", type: "text", label: "Name (after “Borderless”)", req: true },
            { key: "id", type: "id", label: "Short name", from: "name" },
            { key: "flagship", type: "checkbox", label: "Flagship entity" },
            { key: "planet", type: "select", label: "Planet colour", options: [["var(--gold)", "Gold"], ["var(--teal-600)", "Teal"], ["var(--cyan)", "Cyan"], ["var(--soft-blue)", "Soft blue"], ["#7fb7e8", "Light blue"]] },
            { key: "icon", type: "select", label: "Icon", options: ICONS },
            { key: "route", type: "select", label: "Button leads to", options: [["opportunities", "Opportunities"], ["services", "Services & Coaching"], ["ecosystem", "Ambassador application"], ["advertise", "Advertise / partnerships"], ["contact", "Contact"]] },
            { key: "short", type: "bi", label: "One-line description" },
            { key: "text", type: "bitext", label: "Description" },
            { key: "focus", type: "bilist", label: "Focus areas" },
            { key: "role", type: "bi", label: "Role in the ecosystem (short)" }
          ],
          blank: () => ({ flagship: false, planet: "var(--cyan)", icon: "globe", route: "contact" })
        },
        {
          id: "ambassador", kind: "single", file: "content/foundation.json",
          title: "Ambassador programme",
          help: "The benefits list and career path shown in the Ambassador section.",
          fields: [
            { key: "ambassadorBenefits", type: "bilist", label: "Benefits" },
            { key: "ambassadorPath", type: "bilist", label: "Career path (one step per line)" }
          ]
        }
      ]
    },
    {
      group: "Site",
      sections: [
        {
          id: "text", kind: "text", files: { en: "content/text/en.json", fr: "content/text/fr.json" },
          title: "Page text",
          help: "Every heading, button and sentence of the site that isn't part of a list above. Search for the words you want to change."
        },
        {
          id: "settings", kind: "single", file: "content/settings.json",
          title: "Settings & links",
          help: "Links used across the site. Empty links fall back to the Linktree.",
          fields: [
            { key: "defaultLang", type: "select", label: "Language for first-time visitors", options: [["en", "English"], ["fr", "Français"]] },
            { key: "linktree", type: "url", label: "Linktree" },
            { key: "padlet", type: "url", label: "Padlet" },
            { key: "whatsappCommunity", type: "url", label: "WhatsApp community link" },
            { key: "whatsappChannel", type: "url", label: "WhatsApp channel link" },
            { key: "linkedin", type: "url", label: "LinkedIn" },
            { key: "facebook", type: "url", label: "Facebook" },
            { key: "instagram", type: "url", label: "Instagram" },
            { key: "youtube", type: "url", label: "YouTube" },
            { key: "email", type: "text", label: "Contact e-mail", hint: "Shown on the Contact page. Forms open the visitor's e-mail app addressed to it." },
            { key: "formEndpoint", type: "url", label: "Form service address (optional)", hint: "From a service like Formspree. When set, forms send messages there instead of opening an e-mail." }
          ]
        }
      ]
    }
  ];

  // Friendly names for groups of page text (the part of the key before the first dot).
  window.ADMIN_TEXT_GROUPS = {
    meta: "Browser tab title", a11y: "Accessibility", nav: "Main menu", header: "Header", brand: "Logo",
    hero: "Home – top section", home: "Home page", ad: "Advertising box",
    opp: "Opportunities – open calls & menu", type: "Opportunity types", types: "Opportunity types (plural)",
    region: "Regions", level: "Study levels", stats: "Statistics", hub: "Opportunities – overview page",
    free: "“Free” message", dir: "Scholarship guides – list", coverage: "Funding labels", dest: "Destinations",
    guide: "Scholarship guide pages", calls: "Open calls page", tk: "Application toolkit", lau: "Laureates",
    ins: "Insights", search: "Search", growth: "Personal growth", svc: "Services & Coaching", eco: "Ecosystem",
    ads: "Advertise & partnerships", contact: "Contact", form: "Forms", footer: "Footer"
  };
})();
