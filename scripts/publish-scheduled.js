#!/usr/bin/env node
// 自動發佈排程部落格文章（v2：草稿來源改為 Supabase，私密）。
// GitHub Actions 先呼叫 publish-due-drafts EF 拿「今天到期的草稿」，寫到 $DUE_FILE
// （runner 暫存區、repo 外 → 草稿全文絕不進公開 repo），本腳本讀它，對每篇做 surgery：
//   1. 寫兩個 HTML 到網站根（移除 noindex 行）
//   2. blog.html 索引插入置頂卡（錨點 <!-- scheduled-blog-insert --> / -index-insert）
//   3. i18n.js 7 語系插入 {key}t/{key}d（錨點 // <scheduled-blog-i18n:LOCALE>）
//   4. blog-nav.js 導覽加 slug（錨點 // <scheduled-blog-nav>）
//   5. sitemap.xml 加 2 筆 URL + bump blog.html lastmod
// 成功發佈的 slug 寫到 $PUBLISHED_FILE；Actions 據此呼叫 EF mark-published。
// 冪等：blog.html 已含該 slug 卡片 → skip surgery（但仍回報，補「網站發了但 DB 沒標」的半套缺口）。
// 任何錨點/檔案缺失 → exit 1，不留半套（CI 乾淨 checkout 保證原子性）。

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'fr', 'de'];
// 由 Actions 注入（指向 $RUNNER_TEMP，repo 外）。本地測試時 fallback 到 repo 根，
// 但這兩個檔已加進 .gitignore，不會被 commit。
const DUE_FILE = process.env.DUE_FILE || path.join(ROOT, '.due-drafts.json');
const PUBLISHED_FILE = process.env.PUBLISHED_FILE || path.join(ROOT, '.published-slugs.json');

function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }
function escJsStr(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function escHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

if (!fs.existsSync(DUE_FILE)) fail('due drafts file not found: ' + DUE_FILE);
let due;
try { due = JSON.parse(fs.readFileSync(DUE_FILE, 'utf8')).drafts || []; }
catch (e) { fail('cannot parse due file: ' + e.message); }

if (due.length === 0) {
  console.log('No due drafts today. Nothing to do.');
  fs.writeFileSync(PUBLISHED_FILE, '[]');
  process.exit(0);
}

const publishedSlugs = [];

for (const post of due) {
  const slug = post.slug;
  if (!slug || !/^blog-[a-z0-9-]+$/.test(slug)) fail('bad slug: ' + slug);
  const key = post.i18nKey;
  if (!key || !/^blogA\d+$/.test(key)) fail(slug + ': bad i18nKey "' + key + '"');
  const meta = post.meta || {};
  for (const loc of LOCALES) {
    const e = meta[loc];
    if (!e || !e.t || !e.d) fail(slug + ': meta missing locale ' + loc);
  }
  if (typeof post.htmlEn !== 'string' || typeof post.htmlZh !== 'string') fail(slug + ': missing html');

  const enUrl = slug + '.html', zhUrl = slug + '-zh.html';

  // 冪等守門：blog.html 已有這張卡 → 視為已發佈，skip surgery，但仍回報讓 DB 標 published。
  const blogFile = path.join(ROOT, 'blog.html');
  let blogHtml = fs.readFileSync(blogFile, 'utf8');
  if (blogHtml.includes('data-slug="' + slug + '"')) {
    console.log('Already published (card exists), skip surgery: ' + slug);
    publishedSlugs.push(slug);
    continue;
  }

  // FAQPage schema 守門警告（AEO/rich results 必要；草稿 HTML 裡要有才會帶上線）
  if (!post.htmlEn.includes('"FAQPage"'))
    console.warn('⚠️  FAQPage schema 缺漏 (EN): ' + slug + ' — 上線前請在 Supabase 草稿 <head> 補入 FAQPage JSON-LD');
  if (!post.htmlZh.includes('"FAQPage"'))
    console.warn('⚠️  FAQPage schema 缺漏 (ZH): ' + slug + ' — 上線前請在 Supabase 草稿 <head> 補入 FAQPage JSON-LD');

  // 1. 寫兩個 HTML 到網站根（移除 noindex 行）
  for (const [name, raw] of [[enUrl, post.htmlEn], [zhUrl, post.htmlZh]]) {
    const html = raw.split('\n').filter(l => !(l.includes('name="robots"') && l.includes('noindex'))).join('\n');
    fs.writeFileSync(path.join(ROOT, name), html);
  }

  // 2. blog.html：左側索引 <li> + 右側清單 row（都插在標記後＝最新在前）
  const LIST_MARK = '<!-- scheduled-blog-insert -->';
  const INDEX_MARK = '<!-- scheduled-blog-index-insert -->';
  if (!blogHtml.includes(LIST_MARK)) fail('marker missing in blog.html: ' + LIST_MARK);
  if (!blogHtml.includes(INDEX_MARK)) fail('marker missing in blog.html: ' + INDEX_MARK);
  const row = [
    '',
    '',
    '        <article class="p-blog-card" data-slug="' + slug + '">',
    '          <div class="p-blog-card-head">',
    '            <span class="pd-dot" aria-hidden="true"></span>',
    '            <h2><a href="' + enUrl + '" data-en="' + enUrl + '" data-zh="' + zhUrl + '" data-i18n="' + key + 't">' + escHtml(meta.en.t) + '</a></h2>',
    '          </div>',
    '          <p data-i18n="' + key + 'd">' + escHtml(meta.en.d) + '</p>',
    '          <p class="p-blog-card-links">',
    '            <a href="' + enUrl + '" data-i18n="blogReadEn">Read in English →</a> ·',
    '            <a href="' + zhUrl + '" data-i18n="blogReadZh">中文版 →</a>',
    '          </p>',
    '        </article>',
  ].join('\n');
  const indexLi = '\n          <li data-slug="' + slug + '"><a href="' + enUrl + '" data-en="' + enUrl + '" data-zh="' + zhUrl + '"><span class="pd-dot" aria-hidden="true"></span><span data-i18n="' + key + 't">' + escHtml(meta.en.t) + '</span></a></li>';
  blogHtml = blogHtml.replace(LIST_MARK, LIST_MARK + row);
  blogHtml = blogHtml.replace(INDEX_MARK, INDEX_MARK + indexLi);
  fs.writeFileSync(blogFile, blogHtml);

  // 3. i18n.js 7 語系
  const i18nFile = path.join(ROOT, 'i18n.js');
  let i18n = fs.readFileSync(i18nFile, 'utf8');
  for (const loc of LOCALES) {
    const mark = '// <scheduled-blog-i18n:' + loc + '>';
    if (!i18n.includes(mark)) fail('i18n.js marker missing: ' + mark);
    const e = meta[loc];
    const lines = mark + '\n    ' + key + "t: '" + escJsStr(e.t) + "',\n    " + key + "d: '" + escJsStr(e.d) + "',";
    i18n = i18n.replace(mark, lines);
  }
  // 語法檢查（只編譯不執行）；爆掉就整個 fail，不寫檔
  new Function(i18n);
  fs.writeFileSync(i18nFile, i18n);

  // 3b. blog-nav.js 導覽清單（上一篇/下一篇用）
  const navFile = path.join(ROOT, 'blog-nav.js');
  let nav = fs.readFileSync(navFile, 'utf8');
  const NAV_MARK = '// <scheduled-blog-nav>';
  if (!nav.includes(NAV_MARK)) fail('blog-nav.js marker missing: ' + NAV_MARK);
  nav = nav.replace(NAV_MARK, "'" + slug + "',\n    " + NAV_MARK);
  new Function(nav);
  fs.writeFileSync(navFile, nav);

  // 4. sitemap.xml
  const smFile = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smFile, 'utf8');
  const SM_MARK = '<!-- scheduled-blog-sitemap -->';
  if (!sm.includes(SM_MARK)) fail('sitemap.xml marker missing: ' + SM_MARK);
  sm = sm.replace(SM_MARK, SM_MARK
    + '\n  <url><loc>https://powerdoze.app/' + slug + '.html</loc><lastmod>' + post.publishDate + '</lastmod></url>'
    + '\n  <url><loc>https://powerdoze.app/' + slug + '-zh.html</loc><lastmod>' + post.publishDate + '</lastmod></url>');
  sm = sm.replace(/(<loc>https:\/\/powerdoze\.app\/blog\.html<\/loc><lastmod>)[0-9-]+/, '$1' + post.publishDate);
  fs.writeFileSync(smFile, sm);

  publishedSlugs.push(slug);
  console.log('Published: ' + slug + ' (' + post.publishDate + ')');
}

fs.writeFileSync(PUBLISHED_FILE, JSON.stringify(publishedSlugs));
console.log('Done. ' + publishedSlugs.length + ' post(s) published.');
