(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ───────────── Theme ───────────── */
  var themeListeners = [];
  function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.content = t === "light" ? "#f3efe6" : "#0c0b0a";
    themeListeners.forEach(function (fn) { fn(t); });
  }
  function toggleTheme() { setTheme(root.dataset.theme === "light" ? "dark" : "light"); }
  $("#theme-toggle").addEventListener("click", toggleTheme);

  /* ───────────── Header state + current section ───────────── */
  var top = $("#top");
  function onScroll() { top.classList.toggle("is-stuck", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navLinks = $$(".nav a");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { spy.observe(s); });
  }

  /* ───────────── Scroll reveal ───────────── */
  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    // Stagger siblings that enter together
    $$(".work-grid, .rows, .layers").forEach(function (group) {
      $$(":scope > .reveal", group).forEach(function (el, i) { el.style.setProperty("--d", i * 70 + "ms"); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ───────────── Stat counters ───────────── */
  var counters = $$("[data-count]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var end = +e.target.dataset.count, t0 = performance.now(), dur = 1100;
        (function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = "0"; cio.observe(el); });
  }

  /* ───────────── Local time in Bengaluru ───────────── */
  var timeEl = $("#local-time");
  function tickTime() {
    try {
      timeEl.textContent = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata"
      }).format(new Date()) + " IST";
    } catch (e) {}
  }
  tickTime();
  setInterval(tickTime, 20000);
  $("#year").textContent = new Date().getFullYear();

  /* ───────────── Typed rotator ───────────── */
  var rotEl = $("#rotator-text");
  var words = ["Flutter", "Golang", "Spring Boot", "AI integrator", "full-stack developer", "innovator"];
  if (!reduceMotion) {
    var wi = 0, ci = words[0].length, deleting = true;
    setTimeout(function loop() {
      var delay;
      if (deleting) {
        ci--; delay = 38;
        if (ci <= 0) { ci = 0; deleting = false; wi = (wi + 1) % words.length; delay = 280; }
      } else {
        ci++; delay = 75;
        if (ci >= words[wi].length) { deleting = true; delay = 1700; }
      }
      rotEl.textContent = words[wi].slice(0, ci);
      setTimeout(loop, delay);
    }, 2200);
  }

  /* ───────────── Stack layers ───────────── */
  var layers = $$("#layers .layer"), plates = $$("#iso .plate");
  function activateLayer(n) {
    layers.forEach(function (l) {
      var on = l.dataset.layer === String(n);
      l.classList.toggle("is-active", on);
      $("button", l).setAttribute("aria-expanded", on ? "true" : "false");
    });
    plates.forEach(function (p) {
      p.classList.toggle("is-active", p.dataset.layer === String(n));
      // Plates above the active one lift away so it is never hidden.
      p.style.setProperty("--lift", +p.dataset.layer < +n ? 1 : 0);
    });
  }
  layers.forEach(function (l) {
    var n = l.dataset.layer, btn = $("button", l);
    btn.addEventListener("click", function () { activateLayer(n); });
    btn.addEventListener("focus", function () { activateLayer(n); });
    if (window.matchMedia("(hover: hover)").matches) {
      l.addEventListener("pointerenter", function () { activateLayer(n); });
    }
  });
  activateLayer(0);

  /* ───────────── Card spotlight ───────────── */
  $$(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ───────────── Magnetic buttons ───────────── */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        b.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ───────────── Copy email ───────────── */
  var copyBtn = $("#copy-email");
  function copyEmail() {
    var email = copyBtn.dataset.email, hint = $(".email-hint", copyBtn);
    function done(ok) {
      hint.textContent = ok ? "Copied to clipboard" : email;
      copyBtn.classList.add("copied");
      setTimeout(function () { hint.textContent = "Click to copy"; copyBtn.classList.remove("copied"); }, 2200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = email; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      ta.remove(); done(ok);
    }
  }
  copyBtn.addEventListener("click", copyEmail);

  /* ───────────── Contact form → mailto ───────────── */
  $("#contact-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { return $("#" + id).value.trim(); };
    var name = v("user-name");
    var body = "Hi Vedant,\n\nMy name is " + name + " (" + v("user-email") + ").\n\n" +
      v("user-message") + "\n\nRegards,\n" + name;
    window.location.href = "mailto:" + copyBtn.dataset.email +
      "?subject=" + encodeURIComponent(v("user-subject")) + "&body=" + encodeURIComponent(body);
  });

  /* ───────────── Command palette ───────────── */
  var palette = $("#palette"), pInput = $("#palette-input"), pList = $("#palette-list");
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $("#palette-kbd").textContent = isMac ? "⌘K" : "Ctrl K";

  function go(hash) { return function () { var el = $(hash); if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }; }
  function openUrl(u) { return function () { window.open(u, "_blank", "noopener"); }; }
  var commands = [
    { label: "About", hint: "Section", run: go("#about") },
    { label: "Stack", hint: "Section", run: go("#stack") },
    { label: "Work", hint: "Section", run: go("#work") },
    { label: "Path — experience & recognition", hint: "Section", run: go("#path") },
    { label: "Contact", hint: "Section", run: go("#contact") },
    { label: "Back to top", hint: "Section", run: go("#hero") },
    { label: "Switch light / dark theme", hint: "Action", run: toggleTheme },
    { label: "Copy email address", hint: "Action", run: function () { go("#contact")(); copyEmail(); } },
    { label: "GitHub", hint: "Link", run: openUrl("https://github.com/singhvedant") },
    { label: "LinkedIn", hint: "Link", run: openUrl("https://www.linkedin.com/in/vedant-singh-3284071b8/") },
    { label: "Instagram", hint: "Link", run: openUrl("https://www.instagram.com/vedant_s._/") }
  ];
  var shown = [], sel = 0;

  function renderPalette() {
    var q = pInput.value.trim().toLowerCase();
    shown = commands.filter(function (c) { return (c.label + " " + c.hint).toLowerCase().indexOf(q) !== -1; });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    pList.textContent = "";
    if (!shown.length) {
      var li = document.createElement("li");
      li.className = "empty"; li.textContent = "Nothing matches that.";
      pList.appendChild(li);
      return;
    }
    shown.forEach(function (c, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.id = "cmd-" + i;
      li.setAttribute("aria-selected", i === sel ? "true" : "false");
      var a = document.createElement("span"); a.textContent = c.label;
      var b = document.createElement("small"); b.textContent = c.hint;
      li.appendChild(a); li.appendChild(b);
      li.addEventListener("click", function () { runCommand(i); });
      li.addEventListener("pointermove", function () { if (sel !== i) { sel = i; markSelected(); } });
      pList.appendChild(li);
    });
    pInput.setAttribute("aria-activedescendant", "cmd-" + sel);
  }
  function markSelected() {
    $$("li[role=option]", pList).forEach(function (li, i) {
      li.setAttribute("aria-selected", i === sel ? "true" : "false");
      if (i === sel) li.scrollIntoView({ block: "nearest" });
    });
    pInput.setAttribute("aria-activedescendant", "cmd-" + sel);
  }
  function runCommand(i) {
    var c = shown[i];
    if (!c) return;
    palette.close();
    c.run();
  }
  function openPalette() {
    if (palette.open) return;
    pInput.value = ""; sel = 0; renderPalette();
    if (palette.showModal) palette.showModal(); else palette.setAttribute("open", "");
    pInput.focus();
  }
  $("#open-palette").addEventListener("click", openPalette);
  pInput.addEventListener("input", function () { sel = 0; renderPalette(); });
  pInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, shown.length); markSelected(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(1, shown.length); markSelected(); }
    else if (e.key === "Enter") { e.preventDefault(); runCommand(sel); }
  });
  palette.addEventListener("click", function (e) { if (e.target === palette) palette.close(); });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (palette.open) palette.close(); else openPalette();
    }
  });

  /* ───────────── Hero aurora (WebGL, no dependencies) ───────────── */
  (function aurora() {
    var canvas = $("#aurora");
    var gl = null;
    try { gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }); } catch (e) {}
    if (!gl) return;

    var vsrc = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    var fsrc = [
      "precision highp float;",
      "uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 bg,c1,c2,c3;uniform float lite;",
      "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
      " return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
      "float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(17.3,9.1);a*=.5;}return s;}",
      "void main(){",
      " vec2 uv=gl_FragCoord.xy/r;",
      " vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);",
      " vec2 mm=(m-.5)*vec2(r.x/min(r.x,r.y),r.y/min(r.x,r.y));",
      " float md=length(p-mm);",
      " p+=(p-mm)*.18*exp(-md*md*3.);",
      " float tt=t*.045;",
      " vec2 q=vec2(fbm(p*1.1+vec2(0.,tt)),fbm(p*1.1+vec2(5.2,-tt*1.3)));",
      " vec2 w=vec2(fbm(p*1.4+2.6*q+vec2(1.7,9.2)+tt*.7),fbm(p*1.4+2.6*q+vec2(8.3,2.8)-tt*.5));",
      " float f=fbm(p*1.2+3.2*w);",
      " vec3 col=bg;",
      " col=mix(col,c2,smoothstep(.3,1.,length(w))*.8);",
      " col=mix(col,c1,smoothstep(.5,.9,f)*.92);",
      " col=mix(col,c3,smoothstep(.8,1.12,f*f*1.9+q.y*.35)*.85);",
      " col+=c1*.22*exp(-md*md*7.)*(1.-lite);",
      " float k=smoothstep(.0,.95,uv.x*.9+(uv.y-.35)*.55);",
      " k*=smoothstep(-.05,.3,uv.y)*(1.-.55*smoothstep(.8,1.,uv.y));",
      " col=mix(bg,col,k);",
      " gl_FragColor=vec4(col,1.);",
      "}"
    ].join("\n");

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = compile(gl.VERTEX_SHADER, vsrc), fs = compile(gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ["r", "t", "m", "bg", "c1", "c2", "c3", "lite"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

    var palettes = {
      dark: { bg: [0.047, 0.043, 0.039], c1: [1.0, 0.35, 0.17], c2: [0.27, 0.09, 0.42], c3: [1.0, 0.78, 0.45], lite: 0 },
      light: { bg: [0.953, 0.937, 0.902], c1: [1.0, 0.45, 0.24], c2: [0.98, 0.78, 0.62], c3: [0.55, 0.36, 0.86], lite: 1 }
    };
    function applyPalette(t) {
      var p = palettes[t] || palettes.dark;
      gl.uniform3fv(U.bg, p.bg); gl.uniform3fv(U.c1, p.c1); gl.uniform3fv(U.c2, p.c2); gl.uniform3fv(U.c3, p.c3);
      gl.uniform1f(U.lite, p.lite);
      draw();
    }

    var mouse = [0.7, 0.55], target = [0.7, 0.55];
    var start = performance.now(), visible = true, raf = 0;

    function resize() {
      // The noise field is soft, so render well below native resolution.
      var scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
      var w = Math.max(2, Math.round(canvas.clientWidth * scale));
      var hgt = Math.max(2, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== hgt) {
        canvas.width = w; canvas.height = hgt;
        gl.viewport(0, 0, w, hgt);
      }
      gl.uniform2f(U.r, w, hgt);
    }
    function draw() {
      mouse[0] += (target[0] - mouse[0]) * 0.05;
      mouse[1] += (target[1] - mouse[1]) * 0.05;
      gl.uniform1f(U.t, reduceMotion ? 40 : (performance.now() - start) / 1000 + 40);
      gl.uniform2f(U.m, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function frame() {
      raf = 0;
      if (!visible || document.hidden) return;
      draw();
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && !reduceMotion) raf = requestAnimationFrame(frame); }

    resize();
    applyPalette(root.dataset.theme);
    themeListeners.push(applyPalette);
    window.addEventListener("resize", function () { resize(); draw(); });
    canvas.parentElement.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      target[0] = (e.clientX - r.left) / r.width;
      target[1] = 1 - (e.clientY - r.top) / r.height;
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", kick);
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); visible = false; });
    kick();
  })();
})();
