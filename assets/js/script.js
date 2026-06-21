/* ===== FID · 피드디자인 — interactions ===== */
(function () {
  'use strict';
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- nav: scrolled + mobile menu --- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  if (nav) {
    var onNav = function () { nav.classList.toggle('is-scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onNav, { passive: true });
    onNav();
  }
  if (burger) {
    burger.addEventListener('click', function () { nav.classList.toggle('is-open'); });
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('is-open'); });
    });
  }

  /* --- reveal on scroll --- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* --- top progress bar --- */
  var bar = document.getElementById('scrollbar');

  /* --- INTRO scroll engine (로고 → 사진 확장 → 몽타주) --- */
  var intro = document.getElementById('intro');
  var segs = intro ? Array.prototype.slice.call(intro.querySelectorAll('[data-from]')) : [];
  var expandImg = intro && intro.querySelector('.intro__expand-img');
  var introBar = intro && intro.querySelector('.intro__bar i');

  // 구간 내 등장/퇴장 불투명도 (맨 처음 stage는 페이드인 없음, 맨 끝은 페이드아웃 없음)
  var seg = function (p, a, b) {
    if (p <= a) return a <= 0.001 ? 1 : 0;
    if (p >= b) return b >= 0.999 ? 1 : 0;
    var t = (p - a) / (b - a), f = 0.28;
    var oin = a <= 0.001 ? 1 : Math.min(1, t / f);
    var oout = b >= 0.999 ? 1 : Math.min(1, (1 - t) / f);
    return Math.min(oin, oout);
  };

  var ticking = false;
  var onFx = function () {
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    if (bar) bar.style.width = clamp01(window.scrollY / max) * 100 + '%';

    if (intro) {
      var vh = window.innerHeight;
      var total = intro.offsetHeight - vh;
      var rect = intro.getBoundingClientRect();
      var p = clamp01((-rect.top) / (total || 1));
      segs.forEach(function (el) {
        el.style.opacity = seg(p, parseFloat(el.getAttribute('data-from')), parseFloat(el.getAttribute('data-to')));
      });
      // 사진 확장
      if (expandImg) {
        var t = clamp01((p - 0.14) / (0.34 - 0.14));
        expandImg.style.transform = 'scale(' + (1 + t * 2.0) + ')';
        expandImg.style.borderRadius = (24 * (1 - t)) + 'px';
      }
      if (introBar) introBar.style.width = (p * 100) + '%';
    }
    ticking = false;
  };
  var reqFx = function () { if (!ticking) { ticking = true; requestAnimationFrame(onFx); } };
  window.addEventListener('scroll', reqFx, { passive: true });
  window.addEventListener('resize', reqFx);
  onFx();

  /* --- 타자기 효과(써졌다 지워지고 반복) --- */
  var typewriter = function (el, phrases) {
    if (!el) return;
    var pi = 0, ci = 0, deleting = false;
    var tick = function () {
      var w = phrases[pi];
      if (!deleting) {
        ci++; el.textContent = w.slice(0, ci);
        if (ci >= w.length) { deleting = true; return setTimeout(tick, 1400); }
        return setTimeout(tick, 105);
      }
      ci--; el.textContent = w.slice(0, ci);
      if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; return setTimeout(tick, 340); }
      return setTimeout(tick, 50);
    };
    tick();
  };
  typewriter(document.getElementById('homeType'),
    ['하루가 머무는', '일상이 빛나는', '취향이 담긴', '휴식이 깃든']);
  typewriter(document.getElementById('typeText'),
    ['특별한 공간을', '당신의 하루를', '따뜻한 일상을', '진심의 공간을']);

  /* --- 배경 음악 토글 (우측 상단 버튼) --- */
  var bgm = document.getElementById('bgm');
  var bgmBtn = document.getElementById('bgmToggle');
  var bgmHint = document.getElementById('bgmHint');
  var hideHint = function () { if (bgmHint) bgmHint.classList.remove('is-show'); };
  // 우측 상단 안내: 로드 후 잠깐 떴다 약 6초 뒤 사라짐 (한 번만)
  if (bgmHint) {
    setTimeout(function () { if (!bgm || !bgm._started) bgmHint.classList.add('is-show'); }, 1400);
    setTimeout(function () { if (!bgm || !bgm._started) hideHint(); }, 7400);
  }
  if (bgm && bgmBtn) {
    var TARGET_VOL = 0.5;
    var fadeTo = function (target) {
      var step = (target - bgm.volume) / 14, c = 0;
      var iv = setInterval(function () {
        c++; bgm.volume = Math.max(0, Math.min(1, bgm.volume + step));
        if (c >= 14) { bgm.volume = target; clearInterval(iv); }
      }, 45);
    };
    var play = function () {
      if (bgm.preload === 'none') bgm.preload = 'auto';
      bgm.volume = 0;
      var p = bgm.play();
      if (p && p.then) { p.then(function () { fadeTo(TARGET_VOL); }).catch(function () {}); }
      else { bgm.volume = TARGET_VOL; }
      bgm._started = true;
      bgmBtn.classList.add('is-playing');
      bgmBtn.setAttribute('aria-pressed', 'true');
      bgmBtn.setAttribute('aria-label', '배경 음악 끄기');
      hideHint();
    };
    var pause = function () {
      bgm.pause();
      bgmBtn.classList.remove('is-playing');
      bgmBtn.setAttribute('aria-pressed', 'false');
      bgmBtn.setAttribute('aria-label', '배경 음악 켜기');
    };
    bgmBtn.addEventListener('click', function () { if (bgm.paused) play(); else pause(); });
    // 안내를 누르면 음악 재생 + 닫기
    if (bgmHint) bgmHint.addEventListener('click', play);
    window.addEventListener('scroll', function () { if (bgm._started) hideHint(); }, { passive: true });
  }

  /* --- SERVICES: 호버하면 그 칸 영상 재생 --- */
  document.querySelectorAll('.service').forEach(function (s) {
    var v = s.querySelector('.service__video');
    if (!v) return;
    s.addEventListener('mouseenter', function () {
      if (v.preload === 'none') v.preload = 'auto';
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
    s.addEventListener('mouseleave', function () { v.pause(); });
  });

  /* --- 영상 자동재생(모바일/iOS 대응): 화면에 들어오면 재생, 나가면 정지 --- */
  var playVids = document.querySelectorAll('.work__video, .featured__bgvid, .featured__video, .lib__cell--video video');
  var tryPlay = function (v) {
    // iOS는 muted를 속성만으로 인식 못 할 때가 있어 프로퍼티로도 강제
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    if (v.preload === 'none') v.preload = 'auto';
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  };
  if (playVids.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v._inview = true; tryPlay(v); }
        else { v._inview = false; v.pause(); }
      });
    }, { threshold: 0.25 });
    playVids.forEach(function (v) { vio.observe(v); });
    // iOS: 첫 사용자 제스처(터치/클릭/스크롤) 때 보이는 영상 재생 보장
    var kick = function () { playVids.forEach(function (v) { if (v._inview) tryPlay(v); }); };
    window.addEventListener('touchstart', kick, { once: true, passive: true });
    window.addEventListener('touchend', kick, { once: true, passive: true });
    window.addEventListener('click', kick, { once: true });
  }
})();
