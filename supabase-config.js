// ── Supabase Client ─────────────────────────────────────
const SUPABASE_URL = 'https://qhlwjvibxhunlqzvbcwk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_n_YXwYdXvxi79i1JcoDsJg_3StptKF7';

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
  if (!sbClient) return;
  const { error } = await sbClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/auth-callback.html' }
  });
  if (error) console.error('Google sign-in error:', error.message);
}

async function signInWithEmail(email, password) {
  if (!sbClient) return { data: null, error: { message: 'Not initialized' } };
  return await sbClient.auth.signInWithPassword({ email, password });
}

async function signUpWithEmail(email, password) {
  if (!sbClient) return { data: null, error: { message: 'Not initialized' } };
  return await sbClient.auth.signUp({
    email, password,
    options: { emailRedirectTo: window.location.origin + '/auth-callback.html' }
  });
}

async function signOut() {
  if (!sbClient) return;
  const { error } = await sbClient.auth.signOut();
  if (!error) window.location.href = '/';
}

async function resetPassword(email) {
  if (!sbClient) return { data: null, error: { message: 'Not initialized' } };
  return await sbClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth-callback.html?type=recovery'
  });
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
        (avatar ? '<img src="' + avatar + '" alt="" class="nav-avatar">' : '') +
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
