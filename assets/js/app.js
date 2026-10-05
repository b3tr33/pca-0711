// Dossier PCA-0711 — fragment catalogue and players.
(function () {
  "use strict";

  // Ordered by sleeve glyph. `id` = file prefix, `start` = fragment window in the original work (s).
  var FRAGMENTS = [
    { id: "02", glyph: "01:01", title: "Frozen Mid‑Sent█nce", start: 89.2, integrity: 58,
      note: "Voice‑like contour in the lower band. The phrase stops abruptly, which matches the title." },
    { id: "03", glyph: "02:02", title: "Metron█me Heart", start: 73.0, integrity: 64,
      note: "Steady pulse at a regular interval. The team calls it the heartbeat fragment." },
    { id: "04", glyph: "03:03", title: "No T█me at All", start: 123.3, integrity: 47,
      note: "Most damaged groove section. Three complete dropouts." },
    { id: "06", glyph: "04:04", title: "The H█ur With No Edges", start: 116.3, integrity: 52,
      note: "Sustained tones without clear onsets. The edges really are missing." },
    { id: "01", glyph: "05:05", title: "Everything Coll█des", start: 139.9, integrity: 71,
      note: "Densest fragment: many layered sources at once." },
    { id: "07", glyph: "06:06", title: "Tick ██ (Remake)", start: 80.2, integrity: 61,
      note: "The inscription marks it as a re‑making of an earlier work. Evidence of revision." },
    { id: "05", glyph: "07:07", title: "The Clock Caught Its Br█ath", start: 98.2, integrity: 55,
      note: "Marked as an addendum to the cycle ('bonus'). Recovered last." }
  ];
  // Chapter order of the full reconstruction (compose.py): intro 14 s, then 25.7 s per chapter.
  var CHAPTER_ORDER = ["02", "06", "04", "05", "03", "07", "01"];
  var INTRO = 14, CHAPTER = 25.7, FRAG_LEN = 6;

  var PEAKS = window.PEAKS || {};
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fmt(s) {
    s = Math.max(0, s || 0);
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ":" + (r < 10 ? "0" : "") + r;
  }
  function fmtWindow(a) {
    return fmt(a) + "." + Math.round((a % 1) * 10) + "–" + fmt(a + FRAG_LEN) + "." + Math.round((a % 1) * 10);
  }
  function titleHTML(t) {
    return t.replace(/█+/g, function (m) { return '<span class="corrupt" title="illegible">' + m + "</span>"; });
  }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  // Only one audio source plays at a time.
  var current = null;
  function claim(player) {
    if (current && current !== player) current.stop();
    current = player;
  }

  // ---------- fragment cards ----------
  var list = document.getElementById("cards");
  FRAGMENTS.forEach(function (f, i) {
    var li = document.createElement("li");
    li.className = "card";
    li.innerHTML =
      '<figure class="card__img"><img src="assets/img/tablet-' + f.id + '.jpg" alt="Tablet: Medusa bust with the glyph ' + f.glyph + ' across her eyes." loading="lazy" width="700" height="1244">' +
      '<span class="glyph glyph--tag">' + f.glyph + "</span></figure>" +
      '<div class="card__body">' +
        '<p class="cat">PCA‑0711‑' + String(i + 1).padStart(2, "0") + "</p>" +
        "<h3>" + titleHTML(f.title) + "</h3>" +
        '<dl class="card__meta">' +
          "<div><dt>Window</dt><dd>" + fmtWindow(f.start) + "</dd></div>" +
          "<div><dt>Integrity</dt><dd>" + f.integrity + "%</dd></div>" +
        "</dl>" +
        '<div class="meter" aria-hidden="true"><span style="width:' + f.integrity + '%"></span></div>' +
        '<div class="player" data-id="' + f.id + '">' +
          '<div class="seg" role="group" aria-label="Version">' +
            '<button type="button" class="seg__btn is-on" data-v="excavated" aria-pressed="true">As excavated</button>' +
            '<button type="button" class="seg__btn" data-v="restored" aria-pressed="false">Restoration</button>' +
          "</div>" +
          '<div class="player__row">' +
            '<button type="button" class="play" aria-label="Play ' + f.title.replace(/█/g, "") + '"><span class="icon" aria-hidden="true"></span></button>' +
            '<canvas class="wave" height="56" aria-hidden="true"></canvas>' +
            '<span class="player__time">0:00</span>' +
          "</div>" +
        "</div>" +
        '<p class="card__note">' + f.note + "</p>" +
      "</div>";
    list.appendChild(li);
    makeFragmentPlayer(li.querySelector(".player"), f);
  });

  function makeFragmentPlayer(root, f) {
    var audio = new Audio(); audio.preload = "none";
    var version = "excavated";
    var btn = root.querySelector(".play"), canvas = root.querySelector(".wave"), time = root.querySelector(".player__time");
    var self = {
      stop: function () { audio.pause(); root.classList.remove("is-playing"); }
    };
    function src() { return "assets/audio/" + f.id + "-" + version + ".mp3"; }
    function draw() {
      var peaks = (PEAKS[f.id] || {})[version] || [];
      var dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      var c = canvas.getContext("2d"); c.scale(dpr, dpr); c.clearRect(0, 0, w, h);
      var dur = audio.duration || (version === "restored" ? 30 : 6);
      var prog = audio.currentTime / dur;
      var n = peaks.length, bw = w / n;
      var base = css("--line"), hot = css("--accent"), dim = css("--muted");
      for (var k = 0; k < n; k++) {
        var v = Math.max(0.04, peaks[k]) * (h - 6);
        var t = k / n;
        c.fillStyle = t < prog ? hot : (version === "restored" && t * 30 > FRAG_LEN ? dim : base);
        c.fillRect(k * bw + bw * 0.2, (h - v) / 2, Math.max(1, bw * 0.6), v);
      }
      if (version === "restored") {           // marker where reconstruction begins
        var x = (FRAG_LEN / 30) * w;
        c.fillStyle = hot; c.fillRect(x, 0, 1, h);
      }
    }
    root.querySelectorAll(".seg__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.v === version) return;
        var wasPlaying = !audio.paused;
        version = b.dataset.v;
        root.querySelectorAll(".seg__btn").forEach(function (o) {
          var on = o === b; o.classList.toggle("is-on", on); o.setAttribute("aria-pressed", on);
        });
        audio.src = src(); audio.currentTime = 0; time.textContent = "0:00";
        draw();
        if (wasPlaying) { claim(self); audio.play(); }
      });
    });
    btn.addEventListener("click", function () {
      if (!audio.src) audio.src = src();
      if (audio.paused) { claim(self); audio.play(); root.classList.add("is-playing"); }
      else self.stop();
    });
    canvas.addEventListener("click", function (e) {
      if (!audio.src) audio.src = src();
      var r = canvas.getBoundingClientRect(), dur = audio.duration || (version === "restored" ? 30 : 6);
      audio.currentTime = (e.clientX - r.left) / r.width * dur; draw();
    });
    audio.addEventListener("timeupdate", function () { time.textContent = fmt(audio.currentTime); draw(); });
    audio.addEventListener("ended", function () { root.classList.remove("is-playing"); audio.currentTime = 0; draw(); });
    audio.addEventListener("loadedmetadata", draw);
    window.addEventListener("resize", draw);
    requestAnimationFrame(draw);
  }

  // ---------- full reconstruction ----------
  (function () {
    var root = document.getElementById("full");
    var audio = new Audio("assets/audio/restoration-attempt.mp3"); audio.preload = "metadata";
    var btn = root.querySelector(".play"), spec = root.querySelector(".full__spec");
    var played = root.querySelector(".full__played"), head = root.querySelector(".full__head");
    var now = document.getElementById("fullNow"), chapters = document.getElementById("chapters");
    var TOTAL = 208;
    var self = { stop: function () { audio.pause(); root.classList.remove("is-playing"); } };
    var byId = {}; FRAGMENTS.forEach(function (f) { byId[f.id] = f; });

    var marks = [{ t: 0, label: "Scan" }].concat(CHAPTER_ORDER.map(function (id, i) {
      return { t: INTRO + i * CHAPTER, label: byId[id].glyph };
    }), [{ t: INTRO + 7 * CHAPTER, label: "Return" }]);
    marks.forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chap"; b.style.left = (m.t / TOTAL * 100) + "%";
      b.textContent = m.label; b.setAttribute("aria-label", "Jump to " + m.label + " at " + fmt(m.t));
      b.addEventListener("click", function () { seek(m.t); if (audio.paused) btn.click(); });
      chapters.appendChild(b);
    });

    function dur() { return isFinite(audio.duration) ? audio.duration : TOTAL; }
    function paint() {
      var p = audio.currentTime / dur() * 100;
      played.style.width = p + "%"; head.style.left = p + "%";
      now.textContent = fmt(audio.currentTime);
      spec.setAttribute("aria-valuenow", Math.round(audio.currentTime));
    }
    var pending = null;                       // seeks requested before the audio can seek
    function seek(t) {
      t = Math.max(0, Math.min(dur() - 0.1, t));
      if (audio.readyState < 1 || !audio.seekable.length) { pending = t; audio.load(); return; }
      audio.currentTime = t; paint();
    }
    audio.addEventListener("canplay", function () {
      if (pending !== null) {
        var t = pending; pending = null; audio.currentTime = t; paint();
        if (root.classList.contains("is-playing")) audio.play();
      }
    });
    btn.addEventListener("click", function () {
      if (audio.paused) { claim(self); audio.play(); root.classList.add("is-playing"); }
      else self.stop();
    });
    spec.addEventListener("click", function (e) {
      var r = spec.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * dur());
    });
    spec.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { seek(audio.currentTime + 5); e.preventDefault(); }
      if (e.key === "ArrowLeft") { seek(audio.currentTime - 5); e.preventDefault(); }
      if (e.key === " " || e.key === "Enter") { btn.click(); e.preventDefault(); }
    });
    audio.addEventListener("timeupdate", paint);
    audio.addEventListener("ended", function () { root.classList.remove("is-playing"); seek(0); });
  })();

  // ---------- quiet reveal on scroll ----------
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".block").forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
