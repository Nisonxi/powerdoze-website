// 部落格無限滾動：捲到文章底自動接「下一篇」（fetch + append），URL／標題跟著換。
// 由 blog-nav.js 注入（每篇文章自動生效、零逐頁改動），只在文章頁跑、不碰索引頁。
//
// SEO：每篇仍是 crawler 抓得到的真實靜態 .html，本檔只是「讀完一篇順勢往下滑就接下一篇」
// 的前端增強層。URL 用 history.replaceState 跟著捲動切換（不灌歷史紀錄）——返回鍵回到
// 來源／索引，不會被困在文章流裡。新文章插在文末導覽（#blog-nav）之前，所以上一篇/下一篇
// 與留言區自然沉到整條流的最底，不打斷連續閱讀。
(function () {
  // 只在文章頁（blog-xxx.html / blog-xxx-zh.html），索引頁與其他頁不跑。
  var m = location.pathname.match(/\/(blog-[a-z0-9-]+?)(-zh)?\.html$/);
  if (!m) return;
  var POSTS = window.PD_BLOG_POSTS;
  if (!POSTS || !POSTS.length) return;
  if (!('IntersectionObserver' in window) || typeof DOMParser === 'undefined') return;

  var startSlug = m[1];
  var isZh = !!m[2];
  var suffix = isZh ? '-zh.html' : '.html';
  var startIdx = POSTS.indexOf(startSlug);
  if (startIdx === -1) return;
  if (startIdx >= POSTS.length - 1) return; // 已是最後一篇，沒有「下一篇」可接

  var firstSection = document.querySelector('section.p-section');
  var navAnchor = document.getElementById('blog-nav');
  if (!firstSection || !navAnchor) return;

  // ── 自包含樣式（命名空間 pd-inf-）──
  var st = document.createElement('style');
  st.textContent = [
    '.pd-inf-divider{display:flex;align-items:center;gap:14px;max-width: var(--article-w);margin:72px auto 4px;padding:0 24px;',
      'color:var(--ink-3);font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;}',
    '.pd-inf-divider::before,.pd-inf-divider::after{content:"";flex:1;height:1px;background:var(--hair);}',
    '.pd-inf-item{padding-top:0;}',
    '.pd-inf-sentinel{max-width: var(--article-w);margin:40px auto;padding:0 24px;text-align:center;',
      'color:var(--ink-3);font-family:var(--font-mono);font-size:12px;min-height:1px;}',
    '@media (max-width:640px){.pd-inf-divider{margin-top:52px;}}'
  ].join('');
  document.head.appendChild(st);

  // 「繼續閱讀」標籤（7 語系，內嵌避免動 264KB 的 i18n.js）
  var lang = (typeof getLang === 'function') ? getLang() : (isZh ? 'zh-TW' : 'en');
  var NEXTLBL = { 'en': 'Keep reading', 'zh-TW': '繼續閱讀', 'zh-CN': '继续阅读', 'ja': '続けて読む', 'ko': '계속 읽기', 'fr': 'Lire la suite', 'de': 'Weiterlesen' };
  var nextLabel = NEXTLBL[lang] || NEXTLBL.en;

  // 已讀標記（與 blog-nav.js／首頁索引共用 localStorage key）
  var RK = 'pd_blog_read';
  function markRead(slug) {
    try {
      var rd = JSON.parse(localStorage.getItem(RK) || '[]');
      if (Array.isArray(rd) && rd.indexOf(slug) === -1) { rd.push(slug); localStorage.setItem(RK, JSON.stringify(rd)); }
    } catch (e) {}
  }

  // 文章單元清單（第一篇＝既有頁面）
  var units = [{ slug: startSlug, url: location.pathname, title: document.title, h1: firstSection.querySelector('h1') }];
  var nextIdx = startIdx + 1; // 下一個要載入的 POSTS index
  var loading = false;

  // sentinel：插在文末導覽前；新文章也插在它前面（導覽／留言因此恆在最底）
  var sentinel = document.createElement('div');
  sentinel.className = 'pd-inf-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  navAnchor.parentNode.insertBefore(sentinel, navAnchor);

  // ── 切換「目前文章」：URL + 標題 + 已讀（replaceState，不灌歷史紀錄）──
  var activeSlug = startSlug;
  function setActive(unit) {
    if (unit.slug === activeSlug) return;
    activeSlug = unit.slug;
    try { history.replaceState(null, '', unit.url); } catch (e) {}
    if (unit.title) document.title = unit.title;
    markRead(unit.slug);
    // 留言區（在整條流最底）跟著切到目前文章的留言。
    if (typeof window.PD_loadCommentsFor === 'function') window.PD_loadCommentsFor(unit.slug);
  }
  // 目前正在讀哪篇＝「標題已捲過頂部基準線」的最後一篇（scrollspy）。比「標題進場才切」
  // 更穩——快速捲到底時也能算出正確文章，URL 不會卡在第一篇。units 依文件順序排列。
  var ACTIVE_LINE = 140; // sticky 導覽列下方
  var spyScheduled = false;
  function updateActive() {
    spyScheduled = false;
    var current = units[0];
    for (var i = 0; i < units.length; i++) {
      var h = units[i].h1;
      if (h && h.getBoundingClientRect().top <= ACTIVE_LINE) current = units[i];
      else break; // 後面的單元更下面，不可能在線上方
    }
    if (current) setActive(current);
  }
  function onScroll() {
    if (spyScheduled) return;
    spyScheduled = true;
    requestAnimationFrame(updateActive);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── 載入並接上下一篇 ──
  function loadNext() {
    if (loading) return;
    if (nextIdx >= POSTS.length) { sentinel.remove(); loadNextObs.disconnect(); return; }
    loading = true;
    var slug = POSTS[nextIdx];
    sentinel.textContent = nextLabel + '…';
    fetch('/' + slug + suffix)
      .then(function (r) { if (!r.ok) throw new Error('fetch ' + r.status); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var container = doc.querySelector('section.p-section .container');
        if (!container) throw new Error('no container');
        // 移除頂部「← 所有文章 / 中文版」列（直接子 div，含 .p-eyebrow）
        var eyebrow = container.querySelector('.p-eyebrow');
        if (eyebrow) {
          var bar = eyebrow.parentNode;
          while (bar && bar.parentNode !== container) bar = bar.parentNode;
          if (bar && bar.parentNode === container) bar.parentNode.removeChild(bar);
        }
        // 移除內嵌空 #blog-nav（避免與本頁重複 id）
        var innerNav = container.querySelector('#blog-nav');
        if (innerNav && innerNav.parentNode) innerNav.parentNode.removeChild(innerNav);
        var titleEl = doc.querySelector('title');
        var title = titleEl ? titleEl.textContent : '';

        // 包成新 section，前面加「繼續閱讀」分隔器
        var sec = document.createElement('section');
        sec.className = 'p-section pd-inf-item';
        sec.setAttribute('data-slug', slug);
        var divider = document.createElement('div');
        divider.className = 'pd-inf-divider';
        var lbl = document.createElement('span');
        lbl.textContent = nextLabel;
        divider.appendChild(lbl);
        sec.appendChild(divider);
        sec.appendChild(container);
        sentinel.parentNode.insertBefore(sec, sentinel);

        var h1 = container.querySelector('h1');
        units.push({ slug: slug, url: '/' + slug + suffix, title: title, h1: h1 });

        // 翻譯 appended 內任何 data-i18n（保險，內容幾乎全靜態）
        if (typeof applyLang === 'function') { try { applyLang(); } catch (e) {} }

        nextIdx++;
        loading = false;
        sentinel.textContent = '';
        // 長螢幕／短文章：載入後 sentinel 可能仍在預載範圍內 → 再檢查一次續載
        requestAnimationFrame(function () {
          var r = sentinel.getBoundingClientRect();
          if (r.top < (window.innerHeight + 600)) loadNext();
        });
      })
      .catch(function () {
        // 失敗就停用無限滾動，使用者仍可用文末「下一篇」導覽
        loading = false;
        sentinel.textContent = '';
        loadNextObs.disconnect();
      });
  }

  // 接近底部（提前 600px）就預載下一篇
  var loadNextObs = new IntersectionObserver(function (entries) {
    if (entries[0] && entries[0].isIntersecting) loadNext();
  }, { rootMargin: '600px 0px' });
  loadNextObs.observe(sentinel);
})();
