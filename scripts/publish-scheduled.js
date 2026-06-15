#!/usr/bin/env node
// 自動發佈排程部落格文章。
// 讀 scheduled/schedule.json，把 publishDate <= 今天（台北時間）且 status=scheduled 的文章：
//   1. 從 scheduled/<slug>/ 搬兩個 HTML 到網站根目錄（移除 noindex 行）
//   2. blog.html 索引插入置頂卡（錨點 <!-- scheduled-blog-insert -->）
//   3. i18n.js 7 語系插入 {key}t/{key}d（錨點 // <scheduled-blog-i18n:LOCALE>）
//   4. sitemap.xml 加 2 筆 URL + bump blog.html lastmod
//   5. 刪 scheduled/<slug>/、schedule.json 標記 published
// 任何錨點/檔案缺失 → 直接 exit 1，不留半套狀態（由 CI 的乾淨 checkout 保證原子性）。

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCHED_DIR = path.join(ROOT, 'scheduled');
const SCHEDULE_FILE = path.join(SCHED_DIR, 'schedule.json');
const LOCALES = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'fr', 'de'];

function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }
function todayTaipei() { return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); }
function escJsStr(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function escHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

if (!fs.existsSync(SCHEDULE_FILE)) fail('scheduled/schedule.json not found');
const schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
const today = todayTaipei();
const due = (schedule.posts || []).filter(p => p.status === 'scheduled' && p.publishDate <= today);

if (due.length === 0) {
  console.log('No posts due today (' + today + '). Nothing to do.');
  process.exit(0);
}

for (const post of due) {
  const slug = post.slug;
  const dir = path.join(SCHED_DIR, slug);
  const metaFile = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaFile)) fail('missing ' + slug + '/meta.json');
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const key = meta.i18nKey;
  if (!key || !/^blogA\d+$/.test(key)) fail(slug + ': bad i18nKey "' + key + '"');
  for (const loc of LOCALES) {
    const e = (meta.i18n || {})[loc];
    if (!e || !e.t || !e.d) fail(slug + ': meta.json i18n missing locale ' + loc);
  }

  // 1. 搬 HTML（移除 noindex 行）
  for (const name of [slug + '.html', slug + '-zh.html']) {
    const src = path.join(dir, name);
    if (!fs.existsSync(src)) fail('missing scheduled/' + slug + '/' + name);
    let html = fs.readFileSync(src, 'utf8');
    html = html.split('\n').filter(l => !(l.includes('name="robots"') && l.includes('noindex'))).join('\n');
    fs.writeFileSync(path.join(ROOT, name), html);
    fs.unlinkSync(src);
  }

  // 2. blog.html：左側索引 <li> + 右側清單 row（都插在標記後＝最新在前）
  const blogFile = path.join(ROOT, 'blog.html');
  let blogHtml = fs.readFileSync(blogFile, 'utf8');
  const LIST_MARK = '<!-- scheduled-blog-insert -->';
  const INDEX_MARK = '<!-- scheduled-blog-index-insert -->';
  if (!blogHtml.includes(LIST_MARK)) fail('marker missing in blog.html: ' + LIST_MARK);
  if (!blogHtml.includes(INDEX_MARK)) fail('marker missing in blog.html: ' + INDEX_MARK);
  const enUrl = slug + '.html', zhUrl = slug + '-zh.html';
  const row = [
    '',
    '',
    '        <article class="p-blog-card" data-slug="' + slug + '">',
    '          <div class="p-blog-card-head">',
    '            <span class="pd-dot" aria-hidden="true"></span>',
    '            <h2><a href="' + enUrl + '" data-en="' + enUrl + '" data-zh="' + zhUrl + '" data-i18n="' + key + 't">' + escHtml(meta.i18n.en.t) + '</a></h2>',
    '          </div>',
    '          <p data-i18n="' + key + 'd">' + escHtml(meta.i18n.en.d) + '</p>',
    '          <p class="p-blog-card-links">',
    '            <a href="' + enUrl + '" data-i18n="blogReadEn">Read in English →</a> ·',
    '            <a href="' + zhUrl + '" data-i18n="blogReadZh">中文版 →</a>',
    '          </p>',
    '        </article>',
  ].join('\n');
  const indexLi = '\n          <li data-slug="' + slug + '"><a href="' + enUrl + '" data-en="' + enUrl + '" data-zh="' + zhUrl + '"><span class="pd-dot" aria-hidden="true"></span><span data-i18n="' + key + 't">' + escHtml(meta.i18n.en.t) + '</span></a></li>';
  blogHtml = blogHtml.replace(LIST_MARK, LIST_MARK + row);
  blogHtml = blogHtml.replace(INDEX_MARK, INDEX_MARK + indexLi);
  fs.writeFileSync(blogFile, blogHtml);

  // 3. i18n.js 7 語系
  const i18nFile = path.join(ROOT, 'i18n.js');
  let i18n = fs.readFileSync(i18nFile, 'utf8');
  for (const loc of LOCALES) {
    const mark = '// <scheduled-blog-i18n:' + loc + '>';
    if (!i18n.includes(mark)) fail('i18n.js marker missing: ' + mark);
    const e = meta.i18n[loc];
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

  // 5. 清掉草稿資料夾 + 更新狀態
  fs.rmSync(dir, { recursive: true });
  post.status = 'published';
  post.publishedAt = new Date().toISOString();
  console.log('Published: ' + slug + ' (' + post.publishDate + ')');
}

fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2) + '\n');
console.log('Done. ' + due.length + ' post(s) published.');
