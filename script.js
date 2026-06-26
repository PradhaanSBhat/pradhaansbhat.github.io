/* ==========================================================================
   script.js — portfolio renderer + interactions
   --------------------------------------------------------------------------
   A dependency-free, no-build script. It reads the data object in content.js
   (window.PORTFOLIO) and renders the whole page, then wires up interactions.

   You normally DON'T need to touch this file — edit content.js instead.

   HOW IT FITS TOGETHER
     content.js   your data (the only file you usually edit)
     index.html   empty shells: <header> nav + <section id="..."> per section
     styles.css   design tokens (:root) + all component styles
     app.js       fills the shells from content.js and adds behavior

   STRUCTURE OF THIS FILE (search for the banners)
     1. Helpers           $/$$/el/esc + rafThrottle
     2. ICONS + ic()      inline Tabler SVG icons (no icon webfont)
     3. SECTIONS registry  id -> { label, data(), render() }
     4. Renderers         renderHero / renderNews / renderPublications / ...
     5. build()           loops SECTIONS, renders present ones, builds nav + rail
     6. Interactions      theme, nav, filters, pills, views, graph, modal, etc.

   COMMON EXTENSIONS
     • Add a section:  add a renderX(), register it in SECTIONS, and add a
       matching <section id="x"> in index.html. It auto-shows only if its data
       array is non-empty, and a nav link + rail dot appear automatically.
     • Add an icon:    add its Tabler outline path-d array to ICONS, then use
       ic("name"). (Grab paths from tabler-icons.io.)
     • Tune behavior:  HOVER_DELAY (publication hover), the "New" badge window
       in renderNews (isRecent(date, 30)), etc.
   ========================================================================== */
(function () {
  "use strict";

  var DATA = window.PORTFOLIO || {};
  var openPublication = null;   // set by initModal(); used by deep-links + pills
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function has(arr) { return Array.isArray(arr) && arr.length > 0; }
  // Normalize topic: string | string[] | falsy → string[]
  function topicsOf(p) {
    var t = p.topic;
    if (!t) return [];
    return Array.isArray(t) ? t : [t];
  }
  // Renders **bold** markers in text; escapes everything else.
  function escMd(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }

  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { fn(); ticking = false; });
    };
  }

  /* ---- Inline SVG icons (Tabler outline path data) --------------------- */
  var ICONS = {
    "eye": ["M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0", "M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"],
    "bulb": ["M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7", "M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3", "M9.7 17l4.6 0"],
    "database": ["M12 6m-8 0a8 3 0 1 0 16 0a8 3 0 1 0 -16 0", "M4 6v6a8 3 0 0 0 16 0v-6", "M4 12v6a8 3 0 0 0 16 0v-6"],
    "robot": ["M6 4m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z", "M12 2v2", "M9 12v9", "M15 12v9", "M5 16l4 -2", "M15 14l4 2", "M9 18h6", "M10 8v.01", "M14 8v.01"],
    "file-cv": ["M14 3v4a1 1 0 0 0 1 1h4", "M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z", "M11 12.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0", "M13 11l1.5 6l1.5 -6"],
    "school": ["M22 9l-10 -4l-10 4l10 4l10 -4v6", "M6 10.6v5.4a6 3 0 0 0 12 0v-5.4"],
    "brand-github": ["M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"],
    "brand-x": ["M4 4l11.733 16h4.267l-11.733 -16z", "M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"],
    "brand-linkedin": ["M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z", "M8 11l0 5", "M8 8l0 .01", "M12 16l0 -5", "M16 16v-3a2 2 0 0 0 -4 0"],
    "mail": ["M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z", "M3 7l9 6l9 -6"],
    "world": ["M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0", "M3.6 9h16.8", "M3.6 15h16.8", "M11.5 3a17 17 0 0 0 0 18", "M12.5 3a17 17 0 0 1 0 18"],
    "external-link": ["M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6", "M11 13l9 -9", "M15 4h5v5"],
    "file-text": ["M14 3v4a1 1 0 0 0 1 1h4", "M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z", "M9 9l1 0", "M9 13l6 0", "M9 17l6 0"],
    "article": ["M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z", "M7 8h10", "M7 12h10", "M7 16h10"],
    "link": ["M9 15l6 -6", "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464", "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"],
    "player-play": ["M7 4v16l13 -8z"],
    "presentation": ["M3 4l18 0", "M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-10", "M12 16l0 4", "M9 20l6 0", "M8 12l3 -3l2 2l3 -3"],
    "photo": ["M15 8h.01", "M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z", "M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5", "M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3"],
    "star": ["M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"],
    "quote": ["M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5", "M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5"],
    "copy": ["M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z", "M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"],
    "check": ["M5 12l5 5l10 -10"],
    "moon": ["M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"],
    "sun": ["M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", "M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"],
    "menu-2": ["M4 6l16 0", "M4 12l16 0", "M4 18l16 0"],
    "x": ["M18 6l-12 12", "M6 6l12 12"],
    "arrow-up": ["M12 5l0 14", "M18 11l-6 -6", "M6 11l6 -6"],
    "point": ["M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"],
    "arrows-diagonal": ["M16 4l4 0l0 4", "M14 10l6 -6", "M8 20l-4 0l0 -4", "M4 20l6 -6"],
    "list": ["M9 6l11 0", "M9 12l11 0", "M9 18l11 0", "M5 6l0 .01", "M5 12l0 .01", "M5 18l0 .01"],
    "books": ["M5 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z", "M9 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z", "M5 8h4", "M9 16h4", "M13.803 4.56l2.184 -.53c.562 -.135 1.133 .19 1.282 .732l3.695 13.418a1.02 1.02 0 0 1 -.634 1.219l-.133 .041l-2.184 .53c-.562 .135 -1.133 -.19 -1.282 -.732l-3.695 -13.418a1.02 1.02 0 0 1 .634 -1.219l.133 -.041z", "M14 9l4 -1", "M16 16l3.923 -.98"],
    "graph": ["M5.931 6.936l1.275 4.249m5.607 5.609l4.251 1.275", "M11.683 12.317l5.759 -5.759", "M5.5 5.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0", "M18.5 5.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0", "M18.5 18.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0", "M8.5 15.5m-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0"],
    "sparkles": ["M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z"],
    "cube-3d-sphere": ["M6 17.6l-2 -1.1v-2.5", "M4 10v-2.5l2 -1.1", "M10 4.1l2 -1.1l2 1.1", "M18 6.4l2 1.1v2.5", "M20 14v2.5l-2 1.12", "M14 19.9l-2 1.1l-2 -1.1", "M12 12l2 -1.1", "M18 8.6l2 -1.1", "M12 12l0 2.5", "M12 18.5l0 2.5", "M12 12l-2 -1.12", "M6 8.6l-2 -1.1"],
    "edit": ["M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1", "M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z", "M16 5l3 3"],
    "chevron-left": ["M15 6l-6 6l6 6"],
    "chevron-right": ["M9 6l6 6l-6 6"]
  };
  function ic(name) {
    var key = String(name || "point").replace(/^ti-/, "");
    var d = ICONS[key] || ICONS.point;
    var paths = d.map(function (p) { return '<path d="' + p + '"></path>'; }).join("");
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }

  var LINK_ICONS = {
    cv: "file-cv", scholar: "school", github: "brand-github",
    twitter: "brand-x", x: "brand-x", linkedin: "brand-linkedin",
    email: "mail", website: "world", default: "external-link"
  };
  var ACTION_ICONS = {
    pdf: "file-text", arxiv: "article", code: "brand-github",
    project: "link", video: "player-play", demo: "player-play",
    slides: "presentation", poster: "photo"
  };
  var ACTION_LABELS = {
    pdf: "PDF", arxiv: "arXiv", code: "Code", project: "Project",
    video: "Video", demo: "Demo", slides: "Slides", poster: "Poster"
  };

  var SECTIONS = [
    { id: "about",        label: "About",        data: function () { return DATA.profile; },      render: renderHero },
    { id: "news",         label: "News",         data: function () { return DATA.news; },          render: renderNews },
    { id: "publications", label: "Publications", data: function () { return DATA.publications; },  render: renderPublications },
    { id: "talks",        label: "Talks",        data: function () { return DATA.talks; },         render: renderTalks },
    { id: "awards",       label: "Awards",       data: function () { return DATA.awards; },        render: renderAwards },
    { id: "teaching",     label: "Academic Service", data: function () { return DATA.teaching; },      render: renderTeaching }
  ];

  /* ---- shared bits ----------------------------------------------------- */
  function authorsHTML(authors, me) {
    return (authors || []).map(function (a) {
      var name = typeof a === "string" ? a : a.name;
      var url  = typeof a === "string" ? null : a.url;
      var eq   = typeof a === "string" ? false : !!a.eq;
      var sup  = eq ? "<sup>*</sup>" : "";
      if (name === me) return '<span class="author author--me">' + esc(name) + sup + "</span>";
      return url
        ? '<a class="author" href="' + esc(url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + esc(name) + sup + "</a>"
        : '<span class="author">' + esc(name) + sup + "</span>";
    }).join(", ");
  }
  function eqNote(items) {
    var hasEq = (items || []).some(function (p) {
      return (p.authors || []).some(function (a) { return typeof a !== "string" && a.eq; });
    });
    return hasEq ? '<p class="pub__eq-note"><sup>*</sup> Equal contribution</p>' : "";
  }
  function linkChip(l, iconOnly) {
    var name = LINK_ICONS[l.type] || LINK_ICONS.default;
    if (iconOnly) {
      return '<a class="chip chip--icon" href="' + esc(l.url) + '" target="_blank" rel="noopener" title="' +
        esc(l.label) + '" aria-label="' + esc(l.label) + '">' + ic(name) + "</a>";
    }
    return '<a class="chip" href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
      ic(name) + esc(l.label) + "</a>";
  }
  function hlToken(h) {
    if (!h) return null;
    var s = String(h).toLowerCase();
    if (s.indexOf("spotlight") >= 0) return "spotlight";
    if (s.indexOf("oral") >= 0) return "oral";
    return "accent";
  }
  function hlBadgeClass(tok) {
    return tok === "spotlight" ? "badge--gold" : tok === "oral" ? "badge--violet" : "badge--accent";
  }
  function sectionHead(eyebrow, title, sub) {
    return '<div class="section__head reveal">' +
      "<h2>" + esc(title) + "</h2>" +
      (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div>";
  }
  function wrapAlt(section, inner) { section.innerHTML = '<div class="section__wrap">' + inner + "</div>"; }

  /* ====================================================================== */
  /*  Renderers                                                             */
  /* ====================================================================== */

  function renderHero(p, section) {
    var links = (p.links || []).map(function (l) { return linkChip(l); }).join("");
    var roleLine = esc(p.role || "");
    if (p.affiliation) roleLine += ' <span class="dot">·</span> ' + esc(p.affiliation);

    // All text lives in the left column; the portrait sits in the right column.
    var interestsP = p.interests ? '<p class="hero__interests-text">' + esc(p.interests) + "</p>" : "";
    var pills = "";
    if (has(DATA.research)) {
      pills = '<div class="hero__interests">' + DATA.research.map(function (r) {
        var topicAttr = r.topic ? ' data-topic="' + esc(r.topic) + '"' : "";
        var title = r.blurb ? ' title="' + esc(r.blurb) + '"' : "";
        // A pill with a topic is a live button (jumps to that topic in Publications);
        // without a topic it's a static label.
        return r.topic
          ? '<button class="interest interest--live"' + topicAttr + title + ">" + ic(r.icon) + esc(r.title) + "</button>"
          : '<span class="interest interest--static"' + title + ">" + ic(r.icon) + esc(r.title) + "</span>";
      }).join("") + "</div>";
    }

    section.innerHTML =
      '<div class="hero">' +
        '<div class="hero__intro reveal">' +
          '<h1 class="hero__name">Hi, I\'m <span class="hero__name-em">' + esc(p.name) + "!" + "</span></h1>" +
          '<p class="hero__role">' + roleLine + "</p>" +
          '<p class="hero__bio">' + (p.bio || "") + "</p>" +
          interestsP +
          pills +
          (links ? '<div class="hero__links">' + links + "</div>" : "") +
        "</div>" +
        '<div class="hero__portrait reveal">' +
          '<img class="hero__portrait-img" src="' + esc((p.portraits && p.portraits[0]) || p.portrait) +
            '" alt="Portrait of ' + esc(p.name) + '" loading="eager" />' +
        "</div>" +
      "</div>";
  }

  function renderNews(items, section) {
    var rows = items.map(function (n) {
      var txt = n.link ? n.text + ' <a href="' + esc(n.link) + '" target="_blank" rel="noopener">→</a>' : n.text;
      // `new: true` forces the badge regardless of date (handy if you don't
      // want to rely on date parsing at all); otherwise it's date-driven.
      var badge = (n.new === true || isRecent(n.date, 30)) ? '<span class="news-new">New</span> ' : "";
      return '<div class="news-item">' +
        '<span class="news-item__date">' + esc(n.date) + "</span>" +
        '<p class="news-item__text">' + badge + txt + "</p></div>";
    }).join("");
    section.innerHTML = sectionHead("01 — Updates", "News", "Recent happenings.") +
      '<div class="news-timeline reveal"><div class="news-track">' + rows + "</div></div>";
  }

  function renderPublications(items, section) {
    var years = uniqueSorted(items.map(function (p) { return p.year; })).reverse();
    var topics = uniqueSorted(items.reduce(function (acc, p) { return acc.concat(topicsOf(p)); }, []));

    var yearChips = '<button class="filter is-active" data-dim="year" data-val="all">All</button>' +
      years.map(function (y) { return '<button class="filter" data-dim="year" data-val="' + y + '">' + y + "</button>"; }).join("");
    var topicChips = topics.map(function (t) {
      return '<button class="filter" data-dim="topic" data-val="' + esc(t) + '">' + esc(t) + "</button>";
    }).join("");

    var filtersHTML =
      '<div class="pub-filters reveal">' +
        '<span class="pub-filters__label">Year</span>' + yearChips +
        (topics.length ? '<span class="pub-filters__label" style="margin-left:8px">Topic</span>' +
          '<button class="filter is-active" data-dim="topic" data-val="all">All</button>' + topicChips : "") +
      "</div>";

    var cards = items.map(function (p, i) { return pubCardHTML(p, i); }).join("");

    var switcher =
      '<div class="pubviews" role="tablist" aria-label="Publication views">' +
        '<button class="pubview is-active" data-view="list" role="tab">' + ic("list") + "List</button>" +
        '<button class="pubview" data-view="shelf" role="tab">' + ic("books") + "Shelf</button>" +
        '<button class="pubview" data-view="graph" role="tab">' + ic("graph") + "Graph</button>" +
      "</div>";

    wrapAlt(section,
      sectionHead("02 — Research", "Publications",
        "A selection of my work — browse it as a list, a shelf, or a topic graph. Hover or click any paper for its abstract, links, and citation.") +
      switcher +
      filtersHTML +   // shared: filters apply to all three views
      eqNote(items) +
      '<div class="pub-view" data-view="list">' +
        '<div class="pub-list" id="pubList">' + cards + "</div>" +
      "</div>" +
      '<div class="pub-view" data-view="shelf" hidden>' + shelfHTML(items) + "</div>" +
      '<div class="pub-view" data-view="graph" hidden>' + graphHTML(items, DATA.profile) + "</div>" +
      '<p class="pub-empty" id="pubEmpty" hidden>No publications match this filter.</p>');
  }

  /* ---- Shelf view: papers as real-looking book spines ------------------- */
  // All books share the same crimson cloth + size, so the shelf reads as a
  // uniform set (matching the accent used in the list). Spotlight/Oral are
  // distinguished only by a colored ring + foil strip.
  function shelfHTML(items) {
    var spines = items.map(function (p, i) {
      var tok = hlToken(p.highlight);
      var foil = tok ? '<span class="book__foil book__foil--' + tok + '" aria-hidden="true"></span>' : "";
      return '<button class="book' + (tok ? " book--" + tok : "") + '" data-i="' + i + '"' +
        (tok ? ' data-hl="' + tok + '"' : "") +
        ' data-year="' + esc(p.year) + '" data-topic="' + esc(JSON.stringify(topicsOf(p))) + '"' +
        ' aria-label="Open details for ' + esc(p.title) + (p.highlight ? " (" + esc(p.highlight) + ")" : "") + '">' +
        foil +
        '<span class="book__label"><span class="book__title">' + esc(p.title) + "</span></span>" +
        '<span class="book__base">' + esc(p.venue) + " ’" + String(p.year).slice(-2) + "</span>" +
        "</button>";
    }).join("");
    return '<div class="shelf">' +
        '<div class="shelf__back"><div class="shelf__row">' + spines + "</div></div>" +
        '<div class="shelf__ledge" aria-hidden="true"></div>' +
        '<div class="shelf__foot">' + highlightLegend() + '<p class="shelf__hint">Hover a book, click to open it.</p></div>' +
      "</div>";
  }

  // Legend swatches for the highlight types (shared by shelf + graph).
  function highlightLegend(extra) {
    var items = (extra || []).concat([
      { cls: "spotlight", label: "Spotlight" },
      { cls: "oral", label: "Oral" }
    ]);
    return '<div class="hl-legend">' + items.map(function (it) {
      return '<span class="hl-legend__item"><i class="hl-dot hl-dot--' + it.cls + '"></i>' + it.label + "</span>";
    }).join("") + "</div>";
  }

  /* ---- Graph view: a bipartite layout (papers <-> topics) ---------------
   * groupOf(p) returns an array of { key, label } descriptors for a paper.
   */
  function buildBipartiteGraph(items, groupOf) {
    var W = 640, H = 420, nodes = [], edges = [], byGroup = {};
    items.forEach(function (p, i) {
      var pn = { id: "paper:" + i, label: p.title, venue: p.venue, year: p.year, topics: topicsOf(p), kind: "paper", i: i, hl: hlToken(p.highlight) };
      nodes.push(pn);
      (groupOf(p) || []).forEach(function (g) {
        if (!g || !g.key) return;
        var gn = byGroup[g.key];
        if (!gn) { gn = { id: g.key, label: g.label, kind: "group", isMe: !!g.isMe, weight: 0 }; nodes.push(gn); byGroup[g.key] = gn; }
        gn.weight++;
        edges.push({ s: pn, t: gn });
      });
    });
    forceLayout(nodes, edges, W, H);
    return { nodes: nodes, edges: edges, W: W, H: H };
  }

  function paperNodeSVG(n, W) {
    var left = n.x > W * 0.6;
    var lx = left ? -12 : 12, anchor = left ? "end" : "start";
    var venue = esc(n.venue || "") + (n.year ? " ’" + String(n.year).slice(-2) : "");
    return '<g class="gnode gnode--paper' + (n.hl ? " gnode--" + n.hl : "") + '" data-id="' + esc(n.id) + '" data-i="' + n.i +
      '" data-year="' + esc(n.year) + '" data-topic="' + esc(JSON.stringify(n.topics || [])) +
      '" tabindex="0" role="button" aria-label="Open ' + esc(n.label) + '" transform="translate(' + r1(n.x) + ',' + r1(n.y) + ')">' +
      "<title>" + esc(n.label) + "</title>" +
      '<circle r="7"></circle>' +
      '<text class="glabel" text-anchor="' + anchor + '">' +
        '<tspan class="glabel__venue" x="' + lx + '" dy="-2">' + venue + "</tspan>" +
        '<tspan class="glabel__title" x="' + lx + '" dy="14">' + esc(truncate(n.label, 22)) + "</tspan>" +
      "</text></g>";
  }

  function renderGraphSVG(g, groupClass, ariaLabel) {
    var lines = g.edges.map(function (e) {
      return '<line class="gedge" x1="' + r1(e.s.x) + '" y1="' + r1(e.s.y) + '" x2="' + r1(e.t.x) + '" y2="' + r1(e.t.y) +
        '" data-a="' + e.s.id + '" data-b="' + e.t.id + '"></line>';
    }).join("");
    var nodesHTML = g.nodes.map(function (n) {
      if (n.kind === "paper") return paperNodeSVG(n, g.W);
      return '<g class="gnode gnode--' + groupClass + '" data-id="' + esc(n.id) + '" tabindex="0" role="button" aria-label="Highlight ' + esc(n.label) +
        '" transform="translate(' + r1(n.x) + ',' + r1(n.y) + ')">' +
        '<circle r="9"></circle>' +
        '<text class="glabel glabel--' + groupClass + '" x="0" y="-15">' + esc(n.label) + "</text></g>";
    }).join("");
    return '<svg viewBox="0 0 ' + g.W + " " + g.H + '" class="graph__svg" role="img" aria-label="' + esc(ariaLabel) + '">' +
      '<g class="graph__edges">' + lines + "</g><g class=\"graph__nodes\">" + nodesHTML + "</g></svg>";
  }

  /* ---- Collaborators: a list of co-authors; clicking one reveals the
   * papers you share with them, with a link out to their own profile/page
   * when one is provided in content.js. ------------------------------- */
  // Builds: Me (hub) <-> each collaborator, edge weight = papers shared.
  // No paper nodes — clicking a collaborator reveals their shared papers as a
  // text list below the graph instead of as additional nodes.
  function collaboratorGraphHTML(items, profile) {
    var me = (profile && profile.name) || "Me";
    var people = {}, order = [];
    items.forEach(function (p, i) {
      (p.authors || []).forEach(function (a) {
        var name = typeof a === "string" ? a : a.name;
        var url = typeof a === "string" ? null : a.url;
        if (name === (p.me || me)) return;   // you're implicit; not listed as a "collaborator"
        if (!people[name]) { people[name] = { name: name, url: url, papers: [] }; order.push(name); }
        if (!people[name].url && url) people[name].url = url;
        people[name].papers.push(i);
      });
    });
    order.sort(function (a, b) { return people[b].papers.length - people[a].papers.length; });

    if (!order.length) return '<p class="graph__hint">No co-authors listed yet.</p>';

    var W = 640, H = 380;
    var meNode = { id: "me", label: me, kind: "me", weight: items.length };
    var nodes = [meNode];
    var edges = [];
    order.forEach(function (name) {
      var person = people[name];
      var n = { id: "person:" + name, label: name, kind: "person", weight: person.papers.length, url: person.url };
      nodes.push(n);
      // Weighted layout: the more papers you share with someone, the tighter
      // their rest length, so frequent collaborators settle closer to "Me"
      // and occasional ones drift farther out.
      var restLength = Math.max(60, 150 - person.papers.length * 25);
      edges.push({ s: meNode, t: n, k: restLength });
    });
    forceLayout(nodes, edges, W, H);

    var lines = edges.map(function (e) {
      var w = Math.min(1 + (e.t.weight || 1) * 0.5, 4);
      return '<line class="gedge" style="--w:' + w + '" x1="' + r1(e.s.x) + '" y1="' + r1(e.s.y) + '" x2="' + r1(e.t.x) + '" y2="' + r1(e.t.y) +
        '" data-a="' + e.s.id + '" data-b="' + e.t.id + '"></line>';
    }).join("");
    var circles = nodes.map(function (n) {
      var isMe = n.kind === "me";
      var r = Math.min(9 + (n.weight - 1) * 2, 17);
      var cls = "gnode gnode--person" + (isMe ? " gnode--me" : "");
      var urlAttr = n.url ? ' data-url="' + esc(n.url) + '"' : "";
      return '<g class="' + cls + '" data-id="' + esc(n.id) + '"' + urlAttr +
        ' tabindex="0" role="button" aria-label="' + esc(isMe ? n.label : "Highlight shared papers with " + n.label) +
        '" transform="translate(' + r1(n.x) + ',' + r1(n.y) + ')">' +
        '<circle r="' + r + '"></circle>' +
        '<text class="glabel glabel--person' + (isMe ? " glabel--me" : "") + '" x="0" y="-' + (r + 6) + '">' + esc(n.label) + "</text></g>";
    }).join("");
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" class="graph__svg" role="img" aria-label="Graph of ' + esc(me) + "’s collaborators\">" +
      '<g class="graph__edges">' + lines + "</g><g class=\"graph__nodes\">" + circles + "</g></svg>";

    var reveals = order.map(function (name) {
      var person = people[name];
      var papers = person.papers.map(function (i) {
        var p = items[i];
        var tok = hlToken(p.highlight);
        var hlBadge = p.highlight ? '<span class="badge ' + hlBadgeClass(tok) + '">' + ic("star") + esc(p.highlight) + "</span>" : "";
        return '<button class="collab-paper" data-i="' + i + '">' +
          '<span class="badge badge--venue">' + esc(p.venue) + " " + esc(p.year) + "</span>" + hlBadge +
          '<span class="collab-paper__title">' + esc(p.title) + "</span></button>";
      }).join("");
      return '<div class="collab-reveal" data-key="person:' + esc(name) + '" hidden>' + papers + "</div>";
    }).join("");

    return svg + reveals +
      '<p class="graph__hint">Click a collaborator to see the papers they share with ' + esc(me) +
      " · click their highlighted name again to visit their profile.</p>";
  }

  /* ---- Graph view: papers linked to topics, or to collaborators --------- */
  function graphHTML(items, profile) {
    var topicGraph = buildBipartiteGraph(items, function (p) {
      return topicsOf(p).map(function (t) { return { key: "t:" + t, label: t }; });
    });

    var switcher =
      '<div class="graphviews" role="tablist" aria-label="Graph grouping">' +
        '<button class="graphview is-active" data-graph="topic" role="tab">Topics</button>' +
        '<button class="graphview" data-graph="people" role="tab">Collaborators</button>' +
      "</div>";

    var topicLegend = highlightLegend([{ cls: "topic", label: "Topic" }, { cls: "paper", label: "Paper" }]);

    return '<div class="graph" id="pubGraph">' +
      switcher +
      '<div class="graph__pane" data-graph="topic">' +
        renderGraphSVG(topicGraph, "topic", "Graph of papers linked to research topics") +
        topicLegend +
        '<p class="graph__hint">Click a topic to highlight its papers · click a paper to open it.</p>' +
      "</div>" +
      '<div class="graph__pane" data-graph="people" hidden>' +
        collaboratorGraphHTML(items, profile) +
      "</div>" +
    "</div>";
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function truncate(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  // Tiny synchronous force-directed layout, normalized into [pad, W-pad].
  function forceLayout(nodes, edges, W, H) {
    var i, j, it, pad = 40, K = 130;
    nodes.forEach(function (n, idx) {
      var a = (idx / nodes.length) * Math.PI * 2;
      n.x = W / 2 + Math.cos(a) * 120 + (Math.random() - 0.5) * 20;
      n.y = H / 2 + Math.sin(a) * 90 + (Math.random() - 0.5) * 20;
    });
    for (it = 0; it < 320; it++) {
      for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var rep = 2600 / (d * d), fx = dx / d * rep, fy = dy / d * rep;
        a.x += fx; a.y += fy; b.x -= fx; b.y -= fy;
      }
      edges.forEach(function (e) {
        var dx = e.t.x - e.s.x, dy = e.t.y - e.s.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var rest = e.k != null ? e.k : K;   // a per-edge rest length lets some edges pull tighter than others
        var f = (d - rest) * 0.04, fx = dx / d * f, fy = dy / d * f;
        e.s.x += fx; e.s.y += fy; e.t.x -= fx; e.t.y -= fy;
      });
      nodes.forEach(function (n) { n.x += (W / 2 - n.x) * 0.006; n.y += (H / 2 - n.y) * 0.006; });
    }
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(function (n) { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); });
    var sx = (W - 2 * pad) / (maxX - minX || 1), sy = (H - 2 * pad) / (maxY - minY || 1), s = Math.min(sx, sy);
    nodes.forEach(function (n) { n.x = pad + (n.x - minX) * s; n.y = pad + (n.y - minY) * s; });
  }

  // Card teaser: just the image/GIF. (An earlier experiment had interactive
  // teaser widgets here — removed for now; may return as a different idea.)
  function teaserHTML(p) {
    return '<img src="' + esc(p.teaser) + '" alt="" loading="lazy" style="width: 100%; height: 100%; object-fit: fill;">';
  }

  function pubCardHTML(p, i) {
    var tok = hlToken(p.highlight);
    var badges = '<span class="badge badge--venue">' + esc(p.venue) + " " + esc(p.year) + "</span>";
    if (p.highlight) {
      badges += '<span class="badge ' + hlBadgeClass(tok) + '">' + ic("star") + esc(p.highlight) + "</span>";
    }
    var actions = actionButtonsHTML(p.links, true);
    if (p.bibtex) {
      actions += '<button class="action action--cite" data-cite="' + i + '">' + ic("quote") + "BibTeX</button>";
    }

    return '<article class="pub reveal" data-i="' + i + '"' + (tok ? ' data-hl="' + tok + '"' : "") +
           ' data-year="' + esc(p.year) + '" data-topic="' + esc(JSON.stringify(topicsOf(p))) +
           '" tabindex="0" role="button" aria-label="Open details for ' + esc(p.title) + '">' +
      '<div class="pub__media">' + teaserHTML(p) + "</div>" +
      '<span class="pub__expand" aria-hidden="true">' + ic("arrows-diagonal") + "</span>" +
      '<div class="pub__body">' +
        '<div class="pub__badges">' + badges + "</div>" +
        '<h3 class="pub__title">' + esc(p.title) + "</h3>" +
        '<p class="pub__authors">' + authorsHTML(p.authors || [], p.me) + "</p>" +
        '<div class="pub__actions">' + actions + "</div>" +
      "</div></article>";
  }

  function actionButtonsHTML(links, stop) {
    if (!links) return "";
    var order = ["pdf", "arxiv", "code", "project", "video", "demo", "slides", "poster"];
    var s = stop ? ' onclick="event.stopPropagation()"' : "";
    return order.filter(function (k) { return links[k]; }).map(function (k) {
      return '<a class="action" href="' + esc(links[k]) + '" target="_blank" rel="noopener"' + s + '>' +
        ic(ACTION_ICONS[k] || "link") + (ACTION_LABELS[k] || k) + "</a>";
    }).join("");
  }

  function renderTalks(items, section) {
    var rows = items.map(function (t) {
      var links = t.links ? actionButtonsHTML(t.links, false) : "";
      return '<div class="talk reveal">' +
        '<span class="talk__date">' + esc(t.date) + "</span>" +
        '<div><div class="talk__title">' + esc(t.title) + "</div>" +
        '<div class="talk__venue">' + esc(t.venue) + "</div></div>" +
        '<div class="talk__links">' + links + "</div></div>";
    }).join("");
    section.innerHTML = sectionHead("— Speaking", "Talks", "") +
      '<div class="talk-list">' + rows + "</div>";
  }

  function renderAwards(items, section) {
    var cards = items.map(function (a) {
      return '<div class="award reveal">' +
        '<span class="award__year">' + esc(a.year) + "</span>" +
        "<div><h3>" + esc(a.title) + "</h3>" +
        (a.detail ? "<p>" + esc(a.detail) + "</p>" : "") + "</div></div>";
    }).join("");
    wrapAlt(section, sectionHead("— Recognition", "Awards & honors", "") +
      '<div class="award-grid">' + cards + "</div>");
  }

  function renderTeaching(items, section) {
    var rows = items.map(function (t) {
      return '<div class="teach reveal">' +
        '<span class="teach__term">' + esc(t.term) + "</span>" +
        '<div><span class="teach__role">' + esc(t.role) + "</span> — " +
        '<span class="teach__course">' + esc(t.course) + "</span></div></div>";
    }).join("");
    section.innerHTML = sectionHead("03 — Service", "Academic Service", "") +
      '<div class="teach-list">' + rows + "</div>";
  }

  /* ====================================================================== */
  /*  Build page                                                            */
  /* ====================================================================== */

  function build() {
    var p = DATA.profile || {};
    var brand = $("[data-brand]");
    if (brand) brand.textContent = p.name || "Portfolio";
    if (p.name) document.title = p.name + " — Researcher";

    var navLinks = $("#navLinks");
    var rail = el("nav", "rail");
    rail.id = "rail";
    rail.setAttribute("aria-label", "Reading progress");
    SECTIONS.forEach(function (s) {
      var d = s.data();
      var present = s.id === "about" ? !!d : has(d);
      var section = $("#" + s.id);
      if (!present) { if (section) section.remove(); return; }
      s.render(d, section);
      var a = el("a");
      a.href = "#" + s.id;
      a.textContent = s.label;
      a.dataset.target = s.id;
      navLinks.appendChild(a);

      var dot = el("a", "rail__dot", '<span class="rail__label">' + esc(s.label) + "</span>");
      dot.href = "#" + s.id;
      dot.dataset.target = s.id;
      dot.setAttribute("aria-label", s.label);
      rail.appendChild(dot);
    });
    document.body.appendChild(rail);

    buildFooter(p);
    initInteractions();
  }

  function buildFooter(p) {
    var year = new Date().getFullYear();
    var links = (p.links || []).map(function (l) { return linkChip(l); }).join("");
    $("#footer").innerHTML =
      (links ? '<div class="footer__links">' + links + "</div>" : "") +
      '<p class="footer__copy">© ' + year + " " + esc(p.name || "") + "</p>";
  }

  /* ====================================================================== */
  /*  Interactions                                                          */
  /* ====================================================================== */

  function initInteractions() {
    initTheme();
    initNav();
    initFilters();
    initInterestPills();
    initPubViews();
    initGraph();
    initCopyButtons();
    initModal();
    initScrollHint();
    initPortrait();
    initDeepLink();
    initScrollReveal();
    initBackToTop();
    initScrollSpy();
  }

  // Shows an edge-fade + hint on the hero contact-icon row whenever it
  // actually overflows (narrow screens), and tracks scroll position so the
  // fade only appears on the side that has more content to reveal.
  function initScrollHint() {
    var row = $(".hero__links");
    if (!row) return;
    function update() {
      var overflowing = row.scrollWidth > row.clientWidth + 2;
      row.classList.toggle("is-scrollable", overflowing);
      row.classList.toggle("can-scroll-left", row.scrollLeft > 2);
      row.classList.toggle("can-scroll-right", overflowing && row.scrollLeft < row.scrollWidth - row.clientWidth - 2);
    }
    update();
    // No rAF throttle here: this row is tiny (a handful of icons), so a plain
    // listener is plenty cheap and avoids any rAF-timing edge cases.
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  function initPortrait() { /* portrait cycling removed — static image */ }

  // Deep-link: open a paper whose title slug matches the URL hash.
  function initDeepLink() {
    function fromHash() {
      var h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      if (!h || !openPublication) return;
      var pubs = DATA.publications || [];
      for (var i = 0; i < pubs.length; i++) {
        if (slugify(pubs[i].title) === h) { openPublication(i, false); return; }
      }
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
  }

  // Clicking a research-interest pill jumps to Publications (list view) and
  // applies the matching topic filter.
  function initInterestPills() {
    $$(".interest--live").forEach(function (pill) {
      pill.addEventListener("click", function () {
        var topic = pill.dataset.topic;
        var listBtn = $('.pubview[data-view="list"]');
        if (listBtn) listBtn.click();
        var f = $('.filter[data-dim="topic"][data-val="' + topic + '"]');
        if (f) f.click();
        var pubs = document.getElementById("publications");
        if (pubs) pubs.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function initPubViews() {
    var btns = $$(".pubview");
    if (!btns.length) return;
    var views = $$(".pub-view");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.dataset.view;
        btns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-selected", on ? "true" : "false");
        });
        views.forEach(function (vw) { vw.hidden = vw.dataset.view !== v; });
      });
    });
  }

  // Each "pane" (Topics / Collaborators) keeps its own focus state, scoped to
  // itself, so switching panes never leaves stray highlights behind.
  function initGraph() {
    var panes = $$(".graph__pane");
    if (!panes.length) return;

    panes.forEach(function (pane) {
      function clear() {
        pane.classList.remove("is-focus");
        $$(".gnode, .gedge", pane).forEach(function (el) {
          el.classList.remove("is-sel", "is-dim", "is-lit");
        });
        $$(".collab-reveal", pane).forEach(function (r) { r.hidden = true; });
      }
      // A collaborator node (not "Me") behaves like a two-step link: the
      // first click selects it (orange/underlined name + reveals the papers
      // you share with them); clicking that same already-selected node again
      // visits their social/profile link instead of just deselecting.
      function focusGroup(node) {
        var id = node.dataset.id;
        var isCollaborator = node.classList.contains("gnode--person") && !node.classList.contains("gnode--me");
        var already = node.classList.contains("is-sel");
        if (already && isCollaborator) {
          clear();
          var url = node.dataset.url;
          if (url) window.open(url, "_blank", "noopener");
          return;
        }
        clear();
        if (already) return;   // re-clicking an already-selected non-collaborator (e.g. "Me") just deselects
        pane.classList.add("is-focus");
        node.classList.add("is-sel", "is-lit");
        var connected = {};
        $$(".gedge", pane).forEach(function (e) {
          var a = e.getAttribute("data-a"), b = e.getAttribute("data-b");
          if (a === id || b === id) { e.classList.add("is-lit"); connected[a] = connected[b] = true; }
        });
        $$(".gnode", pane).forEach(function (n) {
          var nid = n.dataset.id;
          n.classList.add(nid === id || connected[nid] ? "is-lit" : "is-dim");
        });
        $$(".gedge", pane).forEach(function (e) { if (!e.classList.contains("is-lit")) e.classList.add("is-dim"); });
        if (isCollaborator) {
          var reveal = $('.collab-reveal[data-key="' + id + '"]', pane);
          if (reveal) reveal.hidden = false;
        }
      }
      $$(".gnode--topic, .gnode--person", pane).forEach(function (node) {
        node.addEventListener("click", function () { focusGroup(node); });
        node.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusGroup(node); }
        });
      });
    });

    // Sub-switcher: Topics / Collaborators.
    $$(".graphview").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var which = btn.dataset.graph;
        $$(".graphview").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        panes.forEach(function (p) { p.hidden = p.dataset.graph !== which; });
      });
    });
  }

  function initTheme() {
    var btn = $("#themeToggle");
    function sync() {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.innerHTML = ic(dark ? "sun" : "moon");
    }
    sync();
    btn.addEventListener("click", function () {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      var next = dark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      sync();
    });
  }

  function initNav() {
    var nav = $("#nav");
    var links = $("#navLinks");
    var burger = $("#navBurger");
    burger.innerHTML = ic("menu-2");

    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", rafThrottle(onScroll), { passive: true });

    burger.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.innerHTML = ic(open ? "x" : "menu-2");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        burger.innerHTML = ic("menu-2");
      }
    });
  }

  // Filters are shared across all three views (list, shelf, graph).
  function initFilters() {
    if (!$(".pub-filters")) return;
    var empty = $("#pubEmpty");
    var state = { year: "all", topic: "all" };
    function matches(yr, tp) {
      var tpArr = tp ? (tp[0] === "[" ? JSON.parse(tp) : [tp]) : [];
      return (state.year === "all" || String(yr) === String(state.year)) &&
             (state.topic === "all" || tpArr.indexOf(state.topic) !== -1);
    }

    $$(".filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dim = btn.dataset.dim;
        state[dim] = btn.dataset.val;
        $$('.filter[data-dim="' + dim + '"]').forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        applyFilter();
      });
    });

    function applyFilter() {
      var shown = 0;
      $$(".pub").forEach(function (c) {
        var ok = matches(c.dataset.year, c.dataset.topic);
        c.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      $$(".book").forEach(function (s) {
        s.classList.toggle("is-hidden", !matches(s.dataset.year, s.dataset.topic));
      });
      // graph: hide non-matching paper nodes + their edges; hide topic nodes with
      // no remaining papers.
      // Year/topic filtering only makes sense for the topic graph (papers
      // carry that data); the collaborator graph has no paper nodes at all
      // and is left untouched.
      var topicPane = $('.graph__pane[data-graph="topic"]');
      if (topicPane) {
        var visiblePaper = {};
        $$(".gnode--paper", topicPane).forEach(function (n) {
          var ok = matches(n.dataset.year, n.dataset.topic);
          n.classList.toggle("is-hidden", !ok);
          if (ok) visiblePaper[n.dataset.id] = true;
        });
        var topicShown = {};
        $$(".gedge", topicPane).forEach(function (e) {
          var a = e.getAttribute("data-a"), b = e.getAttribute("data-b");
          var paper = a.indexOf("paper:") === 0 ? a : b;
          var topic = a.indexOf("paper:") === 0 ? b : a;
          var vis = !!visiblePaper[paper];
          e.classList.toggle("is-hidden", !vis);
          if (vis) topicShown[topic] = true;
        });
        $$(".gnode--topic", topicPane).forEach(function (n) {
          n.classList.toggle("is-hidden", !topicShown[n.dataset.id]);
        });
      }
      if (empty) empty.hidden = shown > 0;
    }
  }

  /* Robust copy: clipboard API in secure contexts, execCommand fallback for
     file:// and older browsers (so double-clicking index.html still works). */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("copy failed"));
      } catch (e) { reject(e); }
    });
  }

  function copyToBtn(text, btn, label) {
    copyText(text).then(function () {
      btn.classList.add("is-copied");
      btn.innerHTML = ic("check") + "Copied";
      setTimeout(function () {
        btn.classList.remove("is-copied");
        btn.innerHTML = ic("quote") + label;
      }, 1600);
    }).catch(function () {});
  }

  function initCopyButtons() {
    $$(".action--cite").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var p = (DATA.publications || [])[+b.dataset.cite];
        if (p && p.bibtex) copyToBtn(p.bibtex, b, "BibTeX");
      });
    });
  }

  function initModal() {
    var modal = $("#modal");
    var panel = $(".modal__panel", modal);
    var body = $("#modalBody");
    var lastFocus = null;
    var openedByHover = false;
    var currentIndex = -1;
    var hoverTimer = null, closeTimer = null;
    var canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
    $(".modal__close", modal).innerHTML = ic("x");

    function scheduleClose() { clearTimeout(closeTimer); closeTimer = setTimeout(close, 450); }
    function cancelClose() { clearTimeout(closeTimer); }
    function hoverWatch(e) {
      if (!openedByHover) return;
      if (e.target.closest(".modal__panel")) cancelClose(); else scheduleClose();
    }

    function open(i, byHover, fromBook) {
      var p = (DATA.publications || [])[i];
      if (!p) return;
      clearTimeout(hoverTimer);
      $$(".pub.is-pending").forEach(function (c) { c.classList.remove("is-pending"); });
      openedByHover = !!byHover;
      currentIndex = i;
      if (!byHover) lastFocus = document.activeElement;
      // The "book swinging open" treatment is only used when opened from the
      // Shelf view; other views use the regular fade/scale lightbox.
      modal.classList.toggle("modal--book", !!fromBook);
      // Force the browser to commit the modal--book style change (its rotated
      // resting transform) BEFORE we add is-open below. Without this, the very
      // first time modal--book is ever applied, the browser has no rendered
      // "before" frame to animate from and the swing-open is skipped (every
      // later open works because by then modal--book's rest state has already
      // been painted once).
      void modal.offsetWidth;

      var tok = hlToken(p.highlight);
      var badges = '<span class="badge badge--venue">' + esc(p.venue) + " " + esc(p.year) + "</span>";
      if (p.highlight) badges += '<span class="badge ' + hlBadgeClass(tok) + '">' + ic("star") + esc(p.highlight) + "</span>";

      // The lightbox shows the PRESENTATION video (p.links.video) — this is
      // intentionally different from the card's teaser GIF (the short demo).
      var media = "";
      if (p.links && p.links.video && /youtube|youtu\.be|vimeo|\.mp4/i.test(p.links.video)) {
        if (/\.mp4$/i.test(p.links.video)) {
          media = '<div class="modal__video"><video src="' + esc(p.links.video) + '" controls></video></div>';
        } else {
          media = '<div class="modal__video"><iframe src="' + esc(p.links.video) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
        }
      }

      var bib = p.bibtex ?
        '<div class="bibtex"><button class="action" id="copyBib">' + ic("copy") + "Copy BibTeX</button>" +
        "<pre>" + esc(p.bibtex) + "</pre></div>" : "";

      body.innerHTML =
        '<div class="modal__badges">' + badges + "</div>" +
        '<h2 class="modal__title" id="modalTitle">' + esc(p.title) + "</h2>" +
        '<p class="modal__authors">' + authorsHTML(p.authors || [], p.me) + "</p>" +
        media +
        '<p class="modal__abstract-label">Abstract</p>' +
        '<p class="modal__abstract">' + escMd(p.abstract || "") + "</p>" +
        (actionButtonsHTML(p.links, false) ? '<div class="modal__actions">' + actionButtonsHTML(p.links, false) + "</div>" : "") +
        bib;

      var copyBtn = $("#copyBib");
      if (copyBtn) copyBtn.addEventListener("click", function () {
        copyText(p.bibtex).then(function () {
          copyBtn.innerHTML = ic("check") + "Copied";
          setTimeout(function () { copyBtn.innerHTML = ic("copy") + "Copy BibTeX"; }, 1600);
        }).catch(function () {});
      });

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      cancelClose();
      // Deep-link: reflect the open paper in the URL (so it can be shared).
      if (!byHover) { try { history.replaceState(null, "", "#" + slugify(p.title)); } catch (e) {} }
      if (byHover) { document.addEventListener("mousemove", hoverWatch); }
      else { $(".modal__close", modal).focus(); }
    }

    function close() {
      clearTimeout(closeTimer); clearTimeout(hoverTimer);
      document.removeEventListener("mousemove", hoverWatch);
      openedByHover = false;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      var v = $("video", body); if (v) v.pause();
      body.innerHTML = "";
      // Clear the deep-link hash without scrolling.
      if (location.hash) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
      if (lastFocus) { try { lastFocus.focus(); } catch (e) {} lastFocus = null; }
    }
    openPublication = open;   // expose for deep-links + interest pills

    function navTo(delta) {
      var n = (DATA.publications || []).length;
      if (!n) return;
      // Keep whatever lightbox "skin" is already showing (book-page or plain).
      open(((currentIndex + delta) % n + n) % n, false, modal.classList.contains("modal--book"));
    }
    var prevBtn = $("[data-prev]", modal), nextBtn = $("[data-next]", modal);
    if (prevBtn) { prevBtn.innerHTML = ic("chevron-left") + "Previous"; prevBtn.addEventListener("click", function () { navTo(-1); }); }
    if (nextBtn) { nextBtn.innerHTML = "Next" + ic("chevron-right"); nextBtn.addEventListener("click", function () { navTo(1); }); }

    document.addEventListener("click", function (e) {
      var book = e.target.closest(".book");
      if (book) { open(+book.dataset.i, false, true); return; }   // shelf → book-swing lightbox
      var node = e.target.closest(".gnode--paper, .collab-paper");
      if (node) { open(+node.dataset.i, false); return; }
      var card = e.target.closest(".pub");
      if (card && !e.target.closest("a") && !e.target.closest("button")) open(+card.dataset.i, false);
    });
    document.addEventListener("keydown", function (e) {
      if (modal.classList.contains("is-open")) {
        if (e.key === "Escape") { close(); return; }
        if (e.key === "ArrowLeft") { navTo(-1); return; }
        if (e.key === "ArrowRight") { navTo(1); return; }
      }
      if (e.key !== "Enter" && e.key !== " ") return;
      // graph paper nodes + list cards (spine is a real <button>, handled by click)
      var hit = e.target.closest && e.target.closest(".gnode--paper, .pub");
      if (!hit) return;
      if (hit.classList.contains("pub") && (e.target.closest("a") || e.target.closest("button"))) return;
      e.preventDefault(); open(+hit.dataset.i, false);
    });
    // Hover-to-open the lightbox (desktop pointers only); auto-dismisses when
    // the cursor leaves the panel. Click/keyboard still open it "stickily".
    if (canHover) {
      var HOVER_DELAY = 1000;
      $$(".pub").forEach(function (card) {
        // The countdown only runs while the cursor is on an EMPTY part of the
        // card. Time spent over links/chips doesn't count (timer is paused), so
        // the lightbox never steals a click you were about to make.
        function start() {
          if (hoverTimer) return;
          hoverTimer = setTimeout(function () {
            hoverTimer = null;
            card.classList.remove("is-pending");
            open(+card.dataset.i, true);
          }, HOVER_DELAY);
        }
        function stop() { clearTimeout(hoverTimer); hoverTimer = null; }
        card.addEventListener("mouseenter", function (e) {
          card.classList.add("is-pending");
          if (!e.target.closest("a, button")) start();
        });
        card.addEventListener("mousemove", function (e) {
          if (e.target.closest("a, button")) stop(); else start();
        });
        card.addEventListener("mouseleave", function () {
          stop();
          card.classList.remove("is-pending");
        });
      });
    }
    $$("[data-close]", modal).forEach(function (n) { n.addEventListener("click", close); });
  }

  function initScrollReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  function initBackToTop() {
    var btn = $("#toTop");
    btn.innerHTML = ic("arrow-up");
    var onScroll = function () { btn.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.9); };
    onScroll();
    window.addEventListener("scroll", rafThrottle(onScroll), { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function initScrollSpy() {
    var spied = $$("#navLinks a").concat($$(".rail__dot"));
    if (!spied.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          spied.forEach(function (a) {
            a.classList.toggle("is-active", a.dataset.target === en.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    var ids = {};
    spied.forEach(function (a) { ids[a.dataset.target] = true; });
    Object.keys(ids).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // True if a date string (e.g. "Jun 2026", "12 Jun 2026") is within the last
  // `days` days from now. Used for the "New" badge on news items.
  // Date.parse() is only reliable for ISO 8601 strings ("2026-06-15") — for
  // anything else (e.g. "Jun 2026", the format used in this template's news/
  // talks dates) browsers are free to parse it however they like, and some
  // (Safari, Firefox) return Invalid Date for "month-name year" with no day,
  // even though Chromium-based browsers happily accept it. So we parse that
  // shape ourselves instead of trusting Date.parse with it.
  var MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  function parseFlexibleDate(s) {
    s = String(s || "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {       // ISO date — Date.parse is spec-reliable here
      var iso = Date.parse(s);
      return isNaN(iso) ? null : new Date(iso);
    }
    var m = s.match(/([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s*(\d{4})|([A-Za-z]{3,})\.?\s+(\d{4})/);
    if (m) {
      var mon3 = (m[1] || m[4] || "").slice(0, 3).toLowerCase();
      var monthIndex = MONTH_NAMES.indexOf(mon3);
      if (monthIndex >= 0) {
        var day = m[2] ? parseInt(m[2], 10) : 1;
        var year = parseInt(m[3] || m[5], 10);
        return new Date(year, monthIndex, day);
      }
    }
    var fallback = Date.parse(s);             // last resort for any other shape
    return isNaN(fallback) ? null : new Date(fallback);
  }

  function isRecent(dateStr, days) {
    var d = parseFlexibleDate(dateStr);
    if (!d) return false;
    var diff = Date.now() - d.getTime();
    return diff >= 0 && diff <= (days || 30) * 86400000;
  }

  function uniqueSorted(arr) {
    return arr.filter(function (v, i, a) { return a.indexOf(v) === i; })
              .sort(function (x, y) { return x > y ? 1 : x < y ? -1 : 0; });
  }
  function slugify(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  if (!window.PORTFOLIO) {
    document.getElementById("main").innerHTML =
      '<div style="padding:120px 28px;text-align:center;color:var(--ink-2)">' +
      "<h2>Content failed to load</h2><p>Make sure <code>content.js</code> is present next to index.html.</p></div>";
    return;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
