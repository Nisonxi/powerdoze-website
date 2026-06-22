// ── Supabase Client ─────────────────────────────────────
const SUPABASE_URL = 'https://qhlwjvibxhunlqzvbcwk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_n_YXwYdXvxi79i1JcoDsJg_3StptKF7';
const SUPABASE_FUNCTIONS_URL = SUPABASE_URL + '/functions/v1';

var sbClient = null;
try {
  if (window.supabase && window.supabase.createClient) {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('Supabase JS not loaded');
  }
} catch (e) {
  console.warn('Supabase init failed:', e.message);
}

// ── Auth helpers ────────────────────────────────────────

async function getUser() {
  if (!sbClient) return null;
  const { data: { user } } = await sbClient.auth.getUser();
  return user;
}

async function getSession() {
  if (!sbClient) return null;
  const { data: { session } } = await sbClient.auth.getSession();
  return session;
}

async function signInWithGoogle() {
  if (!sbClient) { alert('Service temporarily unavailable — please refresh the page and try again.'); return; }
  const { error } = await sbClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/auth-callback.html' }
  });
  if (error) console.error('Google sign-in error:', error.message);
}

async function signOut() {
  if (!sbClient) return;
  const { error } = await sbClient.auth.signOut();
  if (!error) window.location.href = '/';
}

// ── Nav auth state ──────────────────────────────────────

async function updateNavAuth() {
  var authSlot = document.getElementById('auth-slot');
  if (!authSlot) return;

  // Show Sign In immediately (no network wait)
  authSlot.innerHTML = '<a href="auth.html" class="btn-signin" data-i18n="authSignIn">Sign In</a>';

  try {
    var user = await getUser();
    if (user) {
      var name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      var avatar = user.user_metadata?.avatar_url;
      authSlot.innerHTML =
        '<div class="nav-user">' +
        '<a href="account.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;">' +
        (avatar ? '<img src="' + avatar + '" alt="' + name.replace(/"/g, '&quot;') + '" class="nav-avatar">' : '') +
        '<span class="nav-username">' + name + '</span>' +
        '</a>' +
        '<button onclick="signOut()" class="nav-signout" data-i18n="authSignOut">Sign Out</button>' +
        '</div>';
    }
  } catch (e) {
    console.warn('Auth check failed:', e.message);
  }

  // Re-apply i18n
  if (typeof applyLang === 'function' && typeof getLang === 'function') {
    applyLang(getLang());
  }
}

// ── 手機漢堡選單 ────────────────────────────────────────
// 全站每頁的 .p-nav 都載入本檔，所以在這裡注入漢堡鈕＝零逐頁改 HTML。
// 桌面 CSS 把 .p-nav-toggle 設 display:none；手機 @media 顯示鈕、把連結/控制項折成下拉。
(function () {
  function initNavMenu() {
    var nav = document.querySelector('.p-nav');
    if (!nav) return;
    var inner = nav.querySelector('.p-nav-inner');
    if (!inner || inner.querySelector('.p-nav-toggle')) return; // 冪等：別重複注入
    var isZh = (typeof getLang === 'function') && /^zh/.test(getLang() || '');
    var btn = document.createElement('button');
    btn.className = 'p-nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', isZh ? '選單' : 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
    inner.appendChild(btn);

    function setOpen(open) {
      nav.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains('menu-open'));
    });
    // 點選單內的連結後自動收起
    var links = inner.querySelector('.p-nav-links');
    if (links) links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    // 點選單外、按 Esc、視窗放大到桌面 → 收起
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('menu-open') && !nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 720) setOpen(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNavMenu);
  else initNavMenu();
})();
