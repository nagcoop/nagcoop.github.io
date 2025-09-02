(function() {
  const form = document.getElementById('loginForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const msg = document.getElementById('msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Entrando...';
    try {
      await auth.signInWithEmailAndPassword(email.value, password.value);
      msg.textContent = 'OK! Redirecionando...';
      window.location.href = 'admin.html';
    } catch (err) {
      msg.textContent = 'Erro ao entrar: ' + err.message;
    }
  });

  signupBtn.addEventListener('click', async () => {
    msg.textContent = 'Criando conta...';
    try {
      await auth.createUserWithEmailAndPassword(email.value, password.value);
      msg.textContent = 'Conta criada! Redirecionando...';
      window.location.href = 'admin.html';
    } catch (err) {
      msg.textContent = 'Erro ao criar conta: ' + err.message;
    }
  });
})();
