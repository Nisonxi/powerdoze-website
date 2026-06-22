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

  // 留言區暫不載入：與無限滾動的連續閱讀體驗衝突（每篇文章底部一塊留言，在「一篇接一篇」
  // 的連續流裡無處可放），且後端（留言表＋EF）尚未部署。留言程式碼仍保留在 blog-comments.js
  // （休眠、不被載入），待重新設計成「無限滾動相容」版本＋部署後端後再開。見 blog_comments_feature memory。
})();
