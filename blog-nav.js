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
    // <scheduled-blog-nav>
  ];
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

  // 留言區：每篇文章自動載入（不需逐篇改 HTML）。blog-comments.js 自己判斷
  // 是否在文章頁、抓 slug、注入到本導覽下方。
  if (!document.getElementById('blog-comments-loader')) {
    var cs = document.createElement('script');
    cs.id = 'blog-comments-loader';
    cs.src = '/blog-comments.js';
    document.body.appendChild(cs);
  }
})();
