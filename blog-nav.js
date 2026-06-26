// 部落格文章頁尾導覽：上一篇 / 所有文章 / 下一篇。
// POSTS 順序＝發佈順序（舊→新）。自動發佈腳本（scripts/publish-scheduled.js）
// 會在 <scheduled-blog-nav> 標記行插入新文章 slug——勿刪標記。
(function () {
  var POSTS = [
    'blog-why-automatic-power-management',
    'blog-windows-sleep-settings-guide',
    'blog-windows-power-tools-compared',
    'blog-always-on-pc-power-savings',
    'blog-local-ai-power-management',
    'blog-quiet-pc-fan-noise',
    'blog-measure-pc-power-consumption',
    'blog-modern-standby-battery-drain',
    'blog-fps-measurement-etw',
    // <scheduled-blog-nav>
  ];
  // 供 blog-infinite.js（無限滾動）共用文章順序。
  window.PD_BLOG_POSTS = POSTS;
  var el = document.getElementById('blog-nav');
  if (!el) return;
  var m = location.pathname.match(/\/([a-z0-9-]+?)(-zh)?\.html$/);
  if (!m) return;
  var slug = m[1];
  // 標記本篇為已讀（首頁索引據此顯示已讀/未讀；換瀏覽器或清快取會重置）
  try {
    var RK = 'pd_blog_read';
    var rd = JSON.parse(localStorage.getItem(RK) || '[]');
    if (Array.isArray(rd) && rd.indexOf(slug) === -1) { rd.push(slug); localStorage.setItem(RK, JSON.stringify(rd)); }
  } catch (e) {}
  var suffix = m[2] ? '-zh.html' : '.html';
  var idx = POSTS.indexOf(slug);
  var prev = idx > 0 ? POSTS[idx - 1] : null;
  var next = (idx >= 0 && idx < POSTS.length - 1) ? POSTS[idx + 1] : null;
  var BTN = 'class="p-btn p-btn-ghost" style="height: 38px; padding: 0 16px; font-size: 14px;"';
  var html = '<nav aria-label="Blog navigation" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--hair);">';
  html += prev
    ? '<a ' + BTN + ' href="/' + prev + suffix + '">← <span data-i18n="blogPrev">Previous</span></a>'
    : '<span style="min-width: 90px;"></span>';
  html += '<a ' + BTN + ' href="/blog.html"><span data-i18n="blogAll">All posts</span></a>';
  html += next
    ? '<a ' + BTN + ' href="/' + next + suffix + '"><span data-i18n="blogNext">Next</span> →</a>'
    : '<span style="min-width: 90px;"></span>';
  html += '</nav>';
  el.innerHTML = html;
  // i18n.js 的 applyLang 在 DOMContentLoaded 跑，會接手翻譯上面的 data-i18n

  // 無限滾動：捲到文章底自動接下一篇（每篇自動生效，零逐頁改動）。
  // 此時 #blog-nav 已填好、window.PD_BLOG_POSTS 已設好，blog-infinite.js 接手。
  if (!document.getElementById('blog-infinite-loader')) {
    var is = document.createElement('script');
    is.id = 'blog-infinite-loader';
    is.src = '/blog-infinite.js';
    document.body.appendChild(is);
  }

  // 留言區（與無限滾動相容）：blog-comments.js 暴露 PD_loadCommentsFor，blog-infinite.js
  // 滾到哪篇就載哪篇的留言；留言區恆在整條流最底，不打斷連續閱讀。後端 blog_comments 表 +
  // get/submit/admin 三個 EF 已部署（2026-06-25）。
  if (!document.getElementById('blog-comments-loader')) {
    var cs = document.createElement('script');
    cs.id = 'blog-comments-loader';
    cs.src = '/blog-comments.js';
    document.body.appendChild(cs);
  }
})();
