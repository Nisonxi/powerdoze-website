// 部落格留言區。loaded by blog-nav.js so every article gets it with zero
// per-page edits. Flow: sign-in required (Google OAuth = verified) → comment
// lands as pending → owner approves in admin.html → shows here. Owner replies
// (is_owner_reply) render nested + badged. Reads via get-blog-comments (public),
// posts via submit-blog-comment (JWT). Bilingual via the page's <html lang>.
(function () {
  // Only on article pages (blog-xxx.html / blog-xxx-zh.html), not the index.
  var m = location.pathname.match(/\/(blog-[a-z0-9-]+?)(-zh)?\.html$/);
  if (!m) return;
  var SLUG = m[1];
  var LANG = m[2] ? 'zh' : 'en';
  var anchor = document.getElementById('blog-nav');
  if (!anchor) return;

  var FN = (typeof SUPABASE_FUNCTIONS_URL !== 'undefined') ? SUPABASE_FUNCTIONS_URL : null;

  var T = LANG === 'zh' ? {
    heading: '留言與提問', loading: '載入留言中…',
    none: '還沒有留言。有問題就留一則吧——我會親自看。',
    signinPrompt: '登入後就能留言、提問。', signin: '使用 Google 登入',
    placeholder: '想問什麼、想說什麼都可以…（送出後會先經過審核才公開）',
    submit: '送出留言', sending: '送出中…',
    okPending: '✅ 已送出！審核通過後就會顯示在這裡。',
    empty: '請先寫點內容。', failed: '送出失敗，請稍後再試。',
    tooLong: '留言太長了（上限 2000 字）。', rate: '你有留言還在等審核，先等等吧。',
    authorReply: '作者回覆', signedInAs: '目前登入：', signout: '登出',
    reply: '回覆', cancel: '取消', moderated: '留言會先經人工審核，避免廣告與不當內容。'
  } : {
    heading: 'Comments & questions', loading: 'Loading comments…',
    none: 'No comments yet. Got a question? Leave one — I read them myself.',
    signinPrompt: 'Sign in to leave a comment or ask a question.', signin: 'Sign in with Google',
    placeholder: 'Ask anything or share a thought… (reviewed before it appears publicly)',
    submit: 'Post comment', sending: 'Posting…',
    okPending: '✅ Sent! It will show up here once it’s approved.',
    empty: 'Please write something first.', failed: 'Could not post — please try again later.',
    tooLong: 'Comment is too long (2000 chars max).', rate: 'You have comments awaiting review — hold on a moment.',
    authorReply: 'Author reply', signedInAs: 'Signed in as ', signout: 'Sign out',
    reply: 'Reply', cancel: 'Cancel', moderated: 'Comments are reviewed by a human before appearing, to keep out spam and abuse.'
  };

  function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }
  function fmtDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(LANG === 'zh' ? 'zh-TW' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { return String(iso).slice(0, 10); }
  }

  // ── Build the section shell ──
  var sec = document.createElement('section');
  sec.id = 'blog-comments';
  sec.style.cssText = 'max-width:720px;margin:48px auto 0;padding-top:24px;border-top:1px solid var(--hair);';
  sec.innerHTML =
    '<h2 class="p-h3" style="font-size:20px;margin:0 0 18px;">' + esc(T.heading) + '</h2>' +
    '<div id="bc-list" style="margin-bottom:28px;color:var(--ink-2);">' + esc(T.loading) + '</div>' +
    '<div id="bc-compose"></div>';
  // Place comments after the nav block.
  if (anchor.parentNode) anchor.parentNode.insertBefore(sec, anchor.nextSibling);

  var listEl = sec.querySelector('#bc-list');
  var composeEl = sec.querySelector('#bc-compose');

  // ── Render comment thread (top-level + 1 level of replies) ──
  function commentHtml(c, isReply) {
    var badge = c.isOwnerReply
      ? ' <span style="font-size:11px;font-weight:600;color:var(--accent);border:1px solid var(--accent);border-radius:999px;padding:1px 8px;margin-left:6px;">' + esc(T.authorReply) + '</span>'
      : '';
    var indent = isReply ? 'margin-left:20px;padding-left:16px;border-left:2px solid var(--hair);' : '';
    return '<div class="bc-item" style="padding:14px 0;' + indent + '">' +
      '<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">' +
        '<strong style="color:var(--ink);font-size:14px;">' + esc(c.authorName || 'Reader') + '</strong>' + badge +
        '<span style="font-size:12px;color:var(--ink-3);">' + esc(fmtDate(c.createdAt)) + '</span>' +
      '</div>' +
      '<div style="color:var(--ink-2);font-size:15px;line-height:1.65;margin-top:6px;white-space:pre-wrap;word-break:break-word;">' + esc(c.body) + '</div>' +
    '</div>';
  }

  function renderList(comments) {
    if (!comments || !comments.length) { listEl.innerHTML = '<p style="color:var(--ink-3);font-size:15px;">' + esc(T.none) + '</p>'; return; }
    var byParent = {};
    var tops = [];
    comments.forEach(function (c) {
      if (c.parentId) { (byParent[c.parentId] = byParent[c.parentId] || []).push(c); }
      else tops.push(c);
    });
    var html = tops.map(function (c) {
      var kids = (byParent[c.id] || []).map(function (r) { return commentHtml(r, true); }).join('');
      return commentHtml(c, false) + kids;
    }).join('');
    listEl.innerHTML = html;
  }

  function loadComments() {
    if (!FN) { listEl.innerHTML = ''; return; }
    // get-blog-comments is public (deployed --no-verify-jwt); we still send the
    // public anon key so the gateway is happy either way.
    var headers = {};
    if (typeof SUPABASE_ANON_KEY !== 'undefined') {
      headers.apikey = SUPABASE_ANON_KEY;
      headers.Authorization = 'Bearer ' + SUPABASE_ANON_KEY;
    }
    fetch(FN + '/get-blog-comments?slug=' + encodeURIComponent(SLUG), { headers: headers })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.status === 'OK') renderList(d.comments); else listEl.innerHTML = ''; })
      .catch(function () { listEl.innerHTML = ''; });
  }

  // ── Compose box: signed-in form, or a sign-in prompt ──
  function renderSignInPrompt() {
    composeEl.innerHTML =
      '<div style="background:var(--surface);border:1px solid var(--hair);border-radius:var(--r-4);padding:18px;text-align:center;">' +
        '<p style="margin:0 0 12px;color:var(--ink-2);font-size:15px;">' + esc(T.signinPrompt) + '</p>' +
        '<button id="bc-signin" class="p-btn p-btn-primary" style="height:40px;padding:0 18px;">' + esc(T.signin) + '</button>' +
        '<p style="margin:12px 0 0;color:var(--ink-3);font-size:12px;">' + esc(T.moderated) + '</p>' +
      '</div>';
    var btn = composeEl.querySelector('#bc-signin');
    if (btn) btn.addEventListener('click', function () {
      try { localStorage.setItem('pd_return_to', location.href); } catch (e) {}
      if (typeof signInWithGoogle === 'function') signInWithGoogle();
      else location.href = '/auth.html';
    });
  }

  function renderForm(user) {
    var name = (user.user_metadata && user.user_metadata.full_name) || (user.email || '').split('@')[0] || 'Reader';
    composeEl.innerHTML =
      '<div style="font-size:13px;color:var(--ink-3);margin-bottom:8px;">' + esc(T.signedInAs) + '<strong style="color:var(--ink-2);">' + esc(name) + '</strong>' +
        ' · <a href="#" id="bc-signout" style="color:var(--accent);">' + esc(T.signout) + '</a></div>' +
      '<textarea id="bc-text" rows="4" placeholder="' + esc(T.placeholder) + '" maxlength="2000" ' +
        'style="width:100%;box-sizing:border-box;background:var(--surface);color:var(--ink);border:1px solid var(--hair);border-radius:var(--r-4);padding:12px;font:inherit;font-size:15px;line-height:1.6;resize:vertical;"></textarea>' +
      '<div style="display:flex;align-items:center;gap:12px;margin-top:10px;">' +
        '<button id="bc-submit" class="p-btn p-btn-primary" style="height:40px;padding:0 18px;">' + esc(T.submit) + '</button>' +
        '<span id="bc-msg" style="font-size:13px;color:var(--ink-3);"></span>' +
      '</div>';
    var ta = composeEl.querySelector('#bc-text');
    var btn = composeEl.querySelector('#bc-submit');
    var msg = composeEl.querySelector('#bc-msg');
    var so = composeEl.querySelector('#bc-signout');
    if (so) so.addEventListener('click', function (e) { e.preventDefault(); if (typeof signOut === 'function') signOut(); });
    btn.addEventListener('click', function () { submit(ta, btn, msg); });
  }

  function submit(ta, btn, msg) {
    var text = (ta.value || '').trim();
    msg.style.color = 'var(--ink-3)';
    if (!text) { msg.textContent = T.empty; return; }
    if (text.length > 2000) { msg.textContent = T.tooLong; return; }
    btn.disabled = true; msg.textContent = T.sending;
    getSession().then(function (session) {
      if (!session) { renderSignInPrompt(); return Promise.reject('no-session'); }
      return fetch(FN + '/submit-blog-comment', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ postSlug: SLUG, body: text, lang: LANG }),
      });
    }).then(function (r) {
      if (!r) return;
      return r.json().then(function (d) {
        btn.disabled = false;
        if (r.ok && d.status === 'OK') {
          ta.value = ''; msg.style.color = 'var(--accent)'; msg.textContent = T.okPending;
        } else if (d.status === 'RATE') {
          msg.textContent = T.rate;
        } else if (d.status === 'AUTH') {
          renderSignInPrompt();
        } else {
          msg.textContent = (d.message && /too long/i.test(d.message)) ? T.tooLong : T.failed;
        }
      });
    }).catch(function (e) { if (e !== 'no-session') { btn.disabled = false; msg.textContent = T.failed; } });
  }

  function initCompose() {
    if (typeof getUser !== 'function') { renderSignInPrompt(); return; }
    getUser().then(function (user) {
      if (user) renderForm(user); else renderSignInPrompt();
    }).catch(function () { renderSignInPrompt(); });
  }

  // sbClient/helpers come from supabase-config.js, which may load right after
  // this script — defer a tick so they're defined.
  function start() { loadComments(); initCompose(); }
  if (typeof sbClient !== 'undefined' && sbClient) start();
  else setTimeout(start, 300);
})();
