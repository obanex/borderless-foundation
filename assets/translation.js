/*
 * Document translation & notarization (#/translation).
 * Visitors describe their request and upload their documents. The request goes to
 * Settings → "Translation form service" (or the general form service), which must accept files.
 * FormSubmit.co addresses are posted as a normal form (it emails the files as attachments);
 * other services (Formspree…) receive the files with fetch.
 */
(function () {
  "use strict";

  const BF = window.BF;
  const { t, L, esc, icon } = BF;
  const CONFIG = window.CONFIG;
  const TR = window.DATA_TRANSLATION;
  const ACCEPT = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
  const MAX_FILES = TR.maxFiles || 5;
  const MAX_MB = TR.maxTotalMB || 10;

  let files = [];

  function sizeLabel(bytes) {
    return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  const serviceKey = (s, i) => s.id || String(i + 1);

  function options(list, selected) {
    return '<option value="">' + t("form.select") + "</option>" +
      list.map((v) => '<option value="' + esc(v) + '"' + (v === selected ? " selected" : "") + ">" + esc(v) + "</option>").join("");
  }

  function page(r) {
    const pre = TR.services.find((s, i) => serviceKey(s, i) === r.query.get("service"));
    const langs = L(TR.languages).concat(t("tr.form.lang.other"));
    const today = new Date().toISOString().slice(0, 10);

    return '<section class="page-hero"><div class="container fade-in"><div class="eyebrow">' + t("tr.eyebrow") + "</div>" +
      "<h1>" + t("tr.title") + '</h1><p class="lead">' + t("tr.sub") + "</p>" +
      '<div class="hero-actions" style="margin-top:24px"><a class="btn btn--gold" href="#/translation?section=tr-form">' + t("tr.hero.cta") + icon("arrow") + "</a>" +
      '<a class="btn btn--ghost" href="#/translation?section=tr-how">' + t("tr.hero.how") + "</a></div>" +
      '<div class="quick-chips">' + [["check", 1], ["info", 2], ["compass", 3]].map(([ic, i]) => '<span class="chip">' + icon(ic) + t("tr.hero.chip" + i) + "</span>").join("") + "</div>" +
      "</div></section>" +

      '<section class="section--tight" style="padding-top:0"><div class="container">' +
      '<div class="section-head"><div><h2>' + t("tr.services.title") + "</h2><p>" + t("tr.services.sub") + "</p></div></div>" +
      '<div class="grid grid-3">' +
      TR.services.map((s, i) =>
        '<div class="card tr-service' + (i === TR.services.length - 1 ? " tier--featured" : "") + '"><span class="icon-bubble' + (i === TR.services.length - 1 ? " icon-bubble--gold" : "") + '" style="margin-bottom:16px">' + icon(s.icon) + "</span>" +
        "<h3>" + L(s.name) + "</h3><p>" + L(s.text) + '</p><p class="price-note">' + L(s.price) + "</p>" +
        '<div class="card-foot"><a class="link-arrow" href="#/translation?service=' + encodeURIComponent(serviceKey(s, i)) + '">' + t("tr.services.cta") + icon("arrow") + "</a></div></div>"
      ).join("") +
      "</div></div></section>" +

      '<section class="section section--band" id="tr-how"><div class="container split">' +
      "<div><h2>" + t("tr.docs.title") + '</h2><ul class="check-list" style="margin-top:18px">' + L(TR.documents).map((d) => "<li>" + esc(d) + "</li>").join("") + "</ul>" +
      '<p class="muted" style="margin-top:14px">' + t("tr.docs.more") + "</p>" +
      "<h3 style=\"margin-top:28px\">" + t("tr.langs.title") + '</h3><div class="quick-chips" style="margin-top:12px">' + L(TR.languages).map((l) => '<span class="chip">' + icon("globe") + esc(l) + "</span>").join("") + "</div></div>" +
      "<div><h2>" + t("tr.how.title") + '</h2><div class="grid" style="margin-top:18px">' +
      [1, 2, 3, 4].map((i) => '<div class="card" style="flex-direction:row;gap:16px;align-items:center"><span class="icon-bubble' + (i === 4 ? " icon-bubble--gold" : "") + '"><b>' + i + '</b></span><p class="mb-0" style="color:var(--text)">' + t("tr.how." + i) + "</p></div>").join("") +
      "</div></div></div></section>" +

      '<section class="section" id="tr-form"><div class="container" style="max-width:900px">' +
      '<div class="card form-card"><h2>' + t("tr.form.title") + '</h2><p class="muted">' + t("tr.form.sub") + "</p>" +
      '<form data-upload-form novalidate><div class="form-grid">' +
      BF.field("name", t("form.name"), "text", true) + BF.field("email", t("form.email"), "email", true) +
      '<div class="field"><label for="phone">' + t("tr.form.phone") + '</label><input class="input" id="phone" name="phone" type="tel" autocomplete="tel"></div>' +
      BF.field("country", t("form.country"), "text", false) +
      '<div class="field full"><label for="service">' + t("tr.form.service") + ' *</label><select class="select" id="service" name="service" required>' +
      options(TR.services.map((s) => L(s.name)), pre && L(pre.name)) + "</select></div>" +
      '<div class="field"><label for="from">' + t("tr.form.from") + ' *</label><select class="select" id="from" name="from" required>' + options(langs) + "</select></div>" +
      '<div class="field"><label for="to">' + t("tr.form.to") + ' *</label><select class="select" id="to" name="to" required>' + options(langs) + "</select></div>" +
      '<fieldset class="field full"><legend class="label">' + t("tr.form.docs") + '</legend><div class="check-chips">' +
      L(TR.documents).map((d) => '<label class="check-chip"><input type="checkbox" name="documents" value="' + esc(d) + '" data-label="' + esc(t("tr.form.docs")) + '"><span>' + icon("check") + esc(d) + "</span></label>").join("") +
      "</div></fieldset>" +
      '<div class="field"><label for="pages">' + t("tr.form.pages") + '</label><input class="input" id="pages" name="pages" type="number" min="1" inputmode="numeric"></div>' +
      '<div class="field"><label for="deadline">' + t("tr.form.deadline") + '</label><input class="input" id="deadline" name="deadline" type="date" min="' + today + '"></div>' +
      '<div class="field"><label for="purpose">' + t("tr.form.purpose") + '</label><input class="input" id="purpose" name="purpose" type="text" placeholder="' + esc(t("tr.form.purpose.ph")) + '"></div>' +
      '<div class="field"><label for="delivery">' + t("tr.form.delivery") + '</label><select class="select" id="delivery" name="delivery">' +
      options(["digital", "paper", "both"].map((k) => t("tr.form.delivery." + k))) + "</select></div>" +
      '<div class="field full"><span class="label" id="files-label">' + t("tr.form.files") + ' *</span>' +
      '<div class="dropzone" data-dropzone><input type="file" id="files" name="attachment" multiple accept="' + ACCEPT.join(",") + '" aria-labelledby="files-label files-hint">' +
      '<span class="icon-bubble icon-bubble--gold">' + icon("upload") + "</span>" +
      "<strong>" + t("tr.form.drop") + '</strong><small id="files-hint">' + t("tr.form.drop.hint", { n: MAX_FILES, mb: MAX_MB }) + "</small></div>" +
      '<ul class="file-list" data-file-list></ul></div>' +
      '<div class="field full"><label for="message">' + t("tr.form.notes") + '</label><textarea class="textarea" id="message" name="message"></textarea></div>' +
      '<label class="consent full"><input type="checkbox" name="consent" value="✓" required data-label="' + esc(t("tr.form.consent.short")) + '"><span>' + t("tr.form.consent") + " *</span></label>" +
      BF.formFooter(t("tr.form.submit")) +
      "</div></form></div>" +
      '<p class="notice">' + icon("info") + t("tr.notice") + "</p>" +
      "</div></section>" +

      (TR.faq.length ? '<section class="section section--band"><div class="container" style="max-width:860px">' +
        '<div class="section-head"><h2>' + t("tr.faq.title") + '</h2></div><div class="faq">' +
        TR.faq.map((f) => "<details><summary>" + esc(L(f.q)) + icon("chevronDown") + "</summary><p>" + esc(L(f.a)) + "</p></details>").join("") +
        "</div></div></section>" : "");
  }

  /* ---------- Files ---------- */

  function fileProblem() {
    if (!files.length) return t("tr.files.none");
    if (files.length > MAX_FILES) return t("tr.files.many", { n: MAX_FILES });
    const bad = files.find((f) => !ACCEPT.some((ext) => f.name.toLowerCase().endsWith(ext)));
    if (bad) return t("tr.files.type", { name: esc(bad.name) });
    if (files.reduce((n, f) => n + f.size, 0) > MAX_MB * 1024 * 1024) return t("tr.files.big", { mb: MAX_MB });
    return "";
  }

  // Keeps the file input in step with the list, so a normal form post sends every file.
  function syncInput(input) {
    try {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    } catch (e) { /* older browsers: the input keeps the last selection */ }
  }

  function renderFiles(form) {
    const total = files.reduce((n, f) => n + f.size, 0);
    form.querySelector("[data-file-list]").innerHTML = files.map((f, i) =>
      '<li><span class="icon-bubble">' + icon("file") + '</span><span class="file-name">' + esc(f.name) + "<small>" + sizeLabel(f.size) + "</small></span>" +
      '<button type="button" class="file-remove" data-remove="' + i + '" aria-label="' + esc(t("tr.form.remove") + " " + f.name) + '">' + icon("close") + "</button></li>"
    ).join("") + (files.length > 1 ? '<li class="file-total">' + files.length + " · " + sizeLabel(total) + "</li>" : "");
  }

  /* ---------- Sending ---------- */

  function bind(r) {
    const form = BF.main.querySelector("form[data-upload-form]");
    if (!form) return;
    files = [];
    const input = form.querySelector("#files");
    const zone = form.querySelector("[data-dropzone]");
    const show = BF.formStatus(form);

    if (r.query.has("sent")) show("ok", t("tr.sent"));

    // Shows the list and any problem with it straight away.
    const update = () => {
      syncInput(input);
      renderFiles(form);
      const problem = files.length ? fileProblem() : "";
      if (problem) show("error", problem);
      else form.querySelector(".form-status").className = "full form-status";
    };

    input.addEventListener("change", () => {
      [...input.files].forEach((f) => {
        if (!files.some((x) => x.name === f.name && x.size === f.size)) files.push(f);
      });
      update();
    });
    ["dragenter", "dragover"].forEach((ev) => zone.addEventListener(ev, () => zone.classList.add("is-over")));
    ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, () => zone.classList.remove("is-over")));
    form.querySelector("[data-file-list]").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      files.splice(Number(btn.dataset.remove), 1);
      update();
      input.focus();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.website && form.website.value) return; // spam trap
      const problem = fileProblem();
      if (problem) { show("error", problem); zone.scrollIntoView({ block: "center" }); return; }

      const fields = BF.formFields(form);
      const subject = "[Borderless Foundation] " + t("tr.form.title") + " · " + form.querySelector("#name").value;
      const endpoint = CONFIG.translationEndpoint || CONFIG.formEndpoint;

      if (endpoint && /formsubmit\.co/i.test(endpoint) && !/\/ajax\//i.test(endpoint)) {
        // FormSubmit: post the form itself, then come back to this page.
        const hidden = { _subject: subject, _template: "table", _next: location.href.split("#")[0] + "#/translation?sent=1" };
        Object.keys(hidden).forEach((k) => {
          const el = document.createElement("input");
          el.type = "hidden"; el.name = k; el.value = hidden[k];
          form.appendChild(el);
        });
        form.action = endpoint;
        form.method = "POST";
        form.enctype = "multipart/form-data";
        show("info", t("tr.sending"));
        form.submit();
      } else if (endpoint) {
        const btn = form.querySelector('[type="submit"]');
        btn.disabled = true;
        show("info", t("tr.sending"));
        try {
          const data = new FormData();
          data.append("_subject", subject);
          data.append("form", "translation");
          data.append("lang", BF.state.lang);
          fields.forEach((f) => data.append(f.label, f.value));
          files.forEach((f) => data.append("attachment", f, f.name));
          const res = await fetch(endpoint, { method: "POST", headers: { Accept: "application/json" }, body: data });
          if (!res.ok) throw new Error(res.status);
          form.reset();
          files = [];
          syncInput(input);
          renderFiles(form);
          show("ok", t("tr.sent"));
        } catch (err) {
          show("error", t("tr.error") + BF.reachUs());
        } finally {
          btn.disabled = false;
        }
      } else if (CONFIG.email) {
        BF.mailForm(form, fields, t("tr.mail.attach") + "\n" + files.map((f) => "- " + f.name).join("\n"));
        show("info", t("tr.mailto"));
      } else {
        show("info", t("form.offline") + BF.reachUs());
      }
    });
  }

  BF.routes.translation = { title: () => "tr.footer", render: page, bind };
})();
