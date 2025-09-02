// /js/auth.js
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const msg = document.getElementById('msg');
  msg.textContent = 'Entrando...';
  try {
    await auth.signInWithEmailAndPassword(email, password);
    location.href = '/admin.html';
  } catch (err) {
    msg.textContent = err.message;
  }
});

auth.onAuthStateChanged(user => {
  if (user && location.pathname.endsWith('/login.html')) {
    location.href = '/admin.html';
  }
});
