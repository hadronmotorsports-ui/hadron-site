/* Hadron Motorsports site script.
   1. opening screen   2. render editable content from #seed   3. nav   4. chart   5. smooth scroll + scroll effects
   Every block is wrapped so a failure in one can never leave the opening screen stuck or the page blank. */
(function () {
  "use strict";
  var D = document, R = D.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var lenis = null;

  function $(s, c) { return (c || D).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); }
  function h(tag, cls, text) { var e = D.createElement(tag); if (cls) e.className = cls; if (text != null && text !== "") e.textContent = text; return e; }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }
  function pad(n) { return ("0" + n).slice(-2); }
  function cleanUrl(u, protos) { try { var x = new URL(u, location.href); return protos.indexOf(x.protocol) > -1 ? x.href : ""; } catch (e) { return ""; } }
  function img(id, v) { return "/api/img/" + id + "/" + v; }

  /* ---------------------------------------------------------------- 1. opening screen */
  var splash = $("#splash"), finished = false, loaded = D.readyState === "complete", started = performance.now();
  var MIN = reduce ? 1300 : 2900;
  function finish() {
    if (finished) return;
    finished = true;
    R.classList.add("ready");
    R.classList.remove("splashing");
    if (splash) { splash.classList.add("out"); setTimeout(function () { splash.style.display = "none"; }, 1300); }
    if (lenis) lenis.start();
    safe(countUp);
    safe(function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
  }
  function tryFinish() {
    if (finished) return;
    var left = MIN - (performance.now() - started);
    if (loaded && left <= 0) finish(); else setTimeout(tryFinish, Math.max(80, left));
  }
  if (splash) {
    R.classList.add("splashing");
    window.addEventListener("load", function () { loaded = true; tryFinish(); });
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { loaded = D.readyState === "complete" || loaded; });
    splash.addEventListener("click", finish);
    D.addEventListener("keydown", finish, { once: true });
    setTimeout(finish, 6500);
    tryFinish();
  } else { R.classList.add("ready"); }

  /* ---------------------------------------------------------------- 2. content */
  var C = { phone: "", email: "", address: "", instagram: "", linkedin: "", youtube: "", heroPhoto: 0, stats: [], cars: [], members: [], results: [], partners: [] };
  safe(function () {
    var s = JSON.parse($("#seed").textContent) || {};
    Object.keys(C).forEach(function (k) { if (s[k] !== undefined && s[k] !== null) C[k] = s[k]; });
    ["stats", "cars", "members", "results", "partners"].forEach(function (k) { if (!Array.isArray(C[k])) C[k] = []; });
  });
  var TIERS = ["Title", "Gold", "Silver", "Associate"];
  var TIER_LABEL = { Title: "Title partner", Gold: "Gold partners", Silver: "Silver partners", Associate: "Associate partners" };

  function gate(id, has, navKey) {
    var sec = $("#" + id);
    if (sec && !has) sec.hidden = true;
    if (!has) $$('a[href="#' + id + '"]').forEach(function (a) { var li = a.closest("li"); if (li) li.hidden = true; else a.hidden = true; });
  }
  function stagger(el, i) { el.setAttribute("data-reveal", ""); el.style.setProperty("--d", String(i % 6)); }

  function renderHero() {
    if (!C.heroPhoto) return;
    var bg = $("#hero-bg"), im = D.createElement("img");
    im.src = img("hero", C.heroPhoto); im.alt = ""; im.width = 1920; im.height = 1080; im.decoding = "async"; im.setAttribute("fetchpriority", "high");
    bg.insertBefore(im, bg.firstChild); bg.classList.add("has-photo"); $(".hero").classList.add("has-photo");
  }

  function renderStats() {
    var ul = $("#stats"); ul.textContent = "";
    if (!C.stats.length) { ul.hidden = true; return; }
    C.stats.forEach(function (s) {
      var li = h("li"), n = h("b", "num", s.value);
      n.setAttribute("data-v", s.value);
      li.appendChild(n); if (s.label) li.appendChild(h("span", "lab", s.label));
      ul.appendChild(li);
    });
  }

  function blueprint() {
    var svg = D.createElementNS(NS, "svg"), use = D.createElementNS(NS, "use");
    svg.setAttribute("viewBox", "0 -10 900 310"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Side view schematic of a Formula Student car"); svg.setAttribute("focusable", "false");
    use.setAttribute("href", "#carsym"); svg.appendChild(use); return svg;
  }

  function renderCars() {
    var track = $("#ctrack"); track.textContent = "";
    gate("cars", C.cars.length > 0);
    C.cars.forEach(function (c, i) {
      var art = h("article", "car"), wrap = h("div", "wrap car-grid"), copy = h("div", "car-copy");
      copy.appendChild(h("p", "car-idx", pad(i + 1) + " / " + pad(C.cars.length)));
      copy.appendChild(h("h3", null, c.name));
      if (c.tagline) copy.appendChild(h("p", "tag", c.tagline));
      if (c.description) copy.appendChild(h("p", "desc", c.description));
      if (c.specs && c.specs.length) {
        var ul = h("ul", "specs");
        c.specs.forEach(function (s) { var li = h("li"); li.appendChild(h("span", null, s.label)); li.appendChild(h("b", null, s.value)); ul.appendChild(li); });
        copy.appendChild(ul);
      }
      var fig = h("figure", "car-media");
      if (c.photo) {
        var im = D.createElement("img");
        im.src = img(c.id, c.photo); im.alt = c.name; im.width = 1280; im.height = 800; im.decoding = "async"; im.loading = i ? "lazy" : "eager";
        fig.appendChild(im);
      } else {
        var ph = h("div", "ph"); ph.appendChild(blueprint()); fig.appendChild(ph);
        fig.appendChild(h("figcaption", null, "Photos of this car are coming soon."));
      }
      wrap.appendChild(copy); wrap.appendChild(fig); art.appendChild(wrap); track.appendChild(art);
    });
  }

  function renderPeople() {
    var box = $("#people"), ul = $("#members"); ul.textContent = "";
    if (!C.members.length) { box.hidden = true; return; }
    C.members.forEach(function (m, i) {
      var li = h("li", "member"), ph = h("div", "ph");
      if (m.photo) {
        var im = D.createElement("img");
        im.src = img(m.id, m.photo); im.alt = m.name; im.width = 480; im.height = 600; im.loading = "lazy"; im.decoding = "async"; ph.appendChild(im);
      } else {
        ph.setAttribute("aria-hidden", "true");
        ph.textContent = m.name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase();
      }
      var body = h("div"), name = h("h4", null, m.name), link = m.linkedin ? cleanUrl(m.linkedin, ["https:"]) : "";
      if (link) { var a = h("a"); a.href = link; a.target = "_blank"; a.rel = "noopener"; a.setAttribute("aria-label", m.name + " on LinkedIn"); a.appendChild(name); body.appendChild(a); } else body.appendChild(name);
      if (m.role) body.appendChild(h("div", "role", m.role));
      if (m.discipline) body.appendChild(h("div", "dtag", m.discipline));
      li.appendChild(ph); li.appendChild(body); stagger(li, i); ul.appendChild(li);
    });
    box.hidden = false;
  }

  function renderResults() {
    var ol = $("#rows"); ol.textContent = "";
    gate("results", C.results.length > 0);
    C.results.forEach(function (r, i) {
      var li = h("li"), d = h("div");
      li.appendChild(h("span", "yr", r.year));
      d.appendChild(h("h3", null, r.title)); if (r.description) d.appendChild(h("p", null, r.description));
      li.appendChild(d); stagger(li, i); ol.appendChild(li);
    });
  }

  function renderPartners() {
    var box = $("#tiers"); box.textContent = "";
    if (!C.partners.length) {
      var row = h("div", "slots");
      for (var i = 0; i < 4; i++) row.appendChild(h("div", "slot", "Your logo here"));
      box.appendChild(row); return;
    }
    TIERS.forEach(function (t, ti) {
      var list = C.partners.filter(function (p) { return p.tier === t; });
      if (!list.length) return;
      var g = h("div", "tier t" + ti), tiles = h("div", "tiles");
      g.appendChild(h("h3", null, TIER_LABEL[t]));
      list.forEach(function (p, i) {
        var link = p.url ? cleanUrl(p.url, ["https:"]) : "", tile = link ? h("a", "tile") : h("div", "tile");
        if (link) { tile.href = link; tile.target = "_blank"; tile.rel = "noopener"; tile.setAttribute("aria-label", p.name); }
        if (p.logo) { var im = D.createElement("img"); im.src = img(p.id, p.logo); im.alt = p.name; im.loading = "lazy"; im.decoding = "async"; im.width = 320; im.height = 180; tile.appendChild(im); }
        else tile.textContent = p.name;
        stagger(tile, i); tiles.appendChild(tile);
      });
      g.appendChild(tiles); box.appendChild(g);
    });
  }

  function renderContact() {
    var mail = C.email ? "mailto:" + C.email : "";
    var mb = $("#mail-btn"); if (mail) mb.href = mail; else mb.hidden = true;
    $("#partner-cta").href = mail ? mail + "?subject=" + encodeURIComponent("Partnership with Hadron Motorsports") : "#join";
    var ul = $("#contact"); ul.textContent = "";
    function item(label, node) { var li = h("li"); li.appendChild(h("span", null, label)); li.appendChild(node); ul.appendChild(li); }
    function link(href, text) { var a = h("a", null, text); a.href = href; return a; }
    if (C.email) item("Email", link(mail, C.email));
    if (C.phone) item("Phone", link("tel:" + C.phone.replace(/[^0-9+]/g, ""), C.phone));
    if (C.address) item("Find us", h("div", null, C.address));
    [["Instagram", C.instagram], ["LinkedIn", C.linkedin], ["YouTube", C.youtube]].forEach(function (s) {
      var u = s[1] ? cleanUrl(s[1], ["https:"]) : ""; if (!u) return;
      var x = new URL(u), a = link(u, x.host.replace(/^www\./, "") + x.pathname.replace(/\/$/, "")); a.target = "_blank"; a.rel = "noopener"; item(s[0], a);
    });
  }

  safe(renderHero); safe(renderStats); safe(renderCars); safe(renderPeople); safe(renderResults); safe(renderPartners); safe(renderContact);

  /* count-up for short numbers (years and long numbers stay still) */
  function countUp() {
    if (reduce) return;
    $$("#stats .num").forEach(function (el) {
      var m = /^(\d{1,3})(\D*)$/.exec(el.getAttribute("data-v") || ""); if (!m) return;
      var n = parseInt(m[1], 10), suf = m[2], t0 = null; if (n < 2) return;
      el.textContent = "0" + suf;
      (function f(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / 1500), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(n * e) + suf; if (p < 1) requestAnimationFrame(f); })(performance.now());
    });
  }

  /* reveal on scroll */
  safe(function () {
    var els = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    els.forEach(function (e) { io.observe(e); });
  });

  /* ---------------------------------------------------------------- 3. navigation */
  var nav = $("#nav"), burger = $("#burger");
  function setMenu(o) {
    nav.classList.toggle("open", o); R.classList.toggle("menu-open", o);
    burger.setAttribute("aria-expanded", String(o)); burger.textContent = o ? "Close" : "Menu";
    if (lenis && finished) { if (o) lenis.stop(); else lenis.start(); }
  }
  burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  D.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  function onScroll() { nav.classList.toggle("scrolled", (window.scrollY || R.scrollTop) > 30); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"); setMenu(false);
      if (id.length < 2) return;
      var t = $(id); if (!t) return;
      if (lenis) { e.preventDefault(); lenis.scrollTo(t, { offset: id === "#cars" || id === "#top" ? 0 : -64, duration: 1.5 }); }
    });
  });

  /* ---------------------------------------------------------------- 4. lap chart */
  safe(function () {
    var svg = $("#chartsvg"); if (!svg) return;
    var M = { l: 46, r: 12, t: 12, b: 34 }, cw = 760 - M.l - M.r, ch = 360 - M.t - M.b, DMAX = 800, VMAX = 120, N = 320;
    function X(d) { return M.l + d / DMAX * cw; }
    function Y(v) { return M.t + ch - (v / VMAX) * ch; }
    var corners = [[110, .7, 34, 22], [260, .55, 38, 30], [430, .8, 26, 18], [560, .62, 40, 26], [700, .5, 30, 34]];
    function base(d, noisy) {
      var v = 104;
      corners.forEach(function (c) { var g = Math.exp(-Math.pow((d - c[0]) / c[2], 2)); v -= g * (104 - c[3]) * (noisy ? 1.06 : 1); });
      if (noisy) v += Math.sin(d * .19) * 1.4 + Math.sin(d * .071) * 1.8 - 2.6 * (d > 20 ? 1 : 0); else v += 1.5;
      return Math.max(14, Math.min(112, v));
    }
    var sim = [], log = [], i;
    for (i = 0; i <= N; i++) { var d = i / N * DMAX; sim.push(base(d, false)); log.push(base(d, true)); }
    function pathOf(a) { return a.map(function (v, k) { return (k ? "L" : "M") + X(k / N * DMAX).toFixed(1) + " " + Y(v).toFixed(1); }).join(""); }
    function el(n, at) { var e = D.createElementNS(NS, n); for (var k in at) e.setAttribute(k, at[k]); return e; }
    [0, 40, 80, 120].forEach(function (v) {
      svg.appendChild(el("line", { x1: M.l, x2: 760 - M.r, y1: Y(v), y2: Y(v), "class": "grid-l" }));
      var t = el("text", { x: M.l - 8, y: Y(v) + 4, "text-anchor": "end" }); t.textContent = v; svg.appendChild(t);
    });
    [0, 200, 400, 600, 800].forEach(function (dd) {
      var last = dd === DMAX, t = el("text", { x: X(dd), y: 350, "text-anchor": last ? "end" : "middle" }); t.textContent = last ? dd + " m" : dd; svg.appendChild(t);
    });
    var yl = el("text", { x: M.l, y: M.t - 3 }); yl.textContent = "km/h"; svg.appendChild(yl);
    var zs = null;
    for (i = 1; i <= N; i++) {
      var slope = (log[i - 1] - log[i]) / (DMAX / N);
      if (slope > .32 && zs === null) zs = i;
      if ((slope <= .32 || i === N) && zs !== null) {
        if (i - zs > 5) svg.appendChild(el("rect", { x: X(zs / N * DMAX), y: M.t, width: X(i / N * DMAX) - X(zs / N * DMAX), height: ch, "class": "zone" }));
        zs = null;
      }
    }
    var defs = el("defs", {}), cp = el("clipPath", { id: "clipL" }), crect = el("rect", { x: M.l - 2, y: 0, width: reduce ? cw + 4 : 0, height: 360 });
    cp.appendChild(crect); defs.appendChild(cp); svg.appendChild(defs);
    svg.appendChild(el("path", { d: pathOf(sim), "class": "trace sim", "clip-path": "url(#clipL)" }));
    svg.appendChild(el("path", { d: pathOf(log), "class": "trace log", "clip-path": "url(#clipL)" }));
    var cur = el("line", { y1: M.t, y2: M.t + ch, "class": "cursor" }); svg.appendChild(cur);
    var rd = $("#r-d"), rs = $("#r-s"), rl = $("#r-l"), rx = $("#r-x");
    function scrub(cx) {
      var r = svg.getBoundingClientRect(), px = (cx - r.left) / r.width * 760;
      var dd = Math.max(0, Math.min(DMAX, (px - M.l) / cw * DMAX)), idx = Math.round(dd / DMAX * N);
      cur.setAttribute("x1", X(dd)); cur.setAttribute("x2", X(dd)); cur.style.opacity = 1;
      rd.textContent = Math.round(dd) + " m"; rs.textContent = sim[idx].toFixed(0) + " km/h"; rl.textContent = log[idx].toFixed(0) + " km/h";
      var dx = log[idx] - sim[idx]; rx.textContent = (dx > 0 ? "+" : "") + dx.toFixed(1) + " km/h";
    }
    svg.addEventListener("pointermove", function (e) { scrub(e.clientX); });
    svg.addEventListener("pointerleave", function () { cur.style.opacity = 0; });
    window.__chartReveal = crect; window.__chartW = cw + 4;
  });

  /* ---------------------------------------------------------------- 5. smooth scroll + scroll effects */
  safe(function () {
    var cars = $("#cars");
    function refreshSoon() { clearTimeout(refreshSoon.t); refreshSoon.t = setTimeout(function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }, 120); }
    window.addEventListener("load", refreshSoon);
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(refreshSoon);
    $$("img", cars).forEach(function (im) { if (!im.complete) im.addEventListener("load", refreshSoon); });

    if (reduce || !window.gsap || !window.ScrollTrigger) { if (window.__chartReveal) window.__chartReveal.setAttribute("width", window.__chartW); return; }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    if (window.Lenis) {
      lenis = new window.Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      if (!finished) lenis.stop();
    }
    /* manifesto words light up as you read */
    var m = $("#manifesto"), words = m.textContent.trim().split(/\s+/);
    m.setAttribute("aria-label", m.textContent.trim()); m.textContent = "";
    words.forEach(function (w, i) { var s = h("span", "w", w + (i < words.length - 1 ? " " : "")); s.setAttribute("aria-hidden", "true"); m.appendChild(s); });
    gsap.fromTo(".manifesto .w", { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: m, start: "top 82%", end: "bottom 50%", scrub: true } });
    /* lap trace draws as it enters */
    if (window.__chartReveal) gsap.fromTo(window.__chartReveal, { attr: { width: 0 } }, { attr: { width: window.__chartW }, ease: "none", scrollTrigger: { trigger: "#chart", start: "top 80%", end: "bottom 55%", scrub: 0.6 } });
    /* cars slide sideways while the section is pinned (desktop, two or more cars) */
    var mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", function () {
      if (C.cars.length < 2) return;
      var track = $("#ctrack"), bar = $("#progress i");
      cars.classList.add("is-pinned");
      var dist = function () { return track.scrollWidth - window.innerWidth; };
      gsap.to(track, { x: function () { return -dist(); }, ease: "none", scrollTrigger: { trigger: cars, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: function (s) { bar.style.transform = "scaleX(" + s.progress + ")"; } } });
      return function () { cars.classList.remove("is-pinned"); };
    });
  });
})();
