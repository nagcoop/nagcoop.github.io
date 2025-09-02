// /js/admin.js
const guard = document.getElementById('guard');
const panels = document.getElementById('admin-panels');
document.getElementById('logout').onclick = () => auth.signOut();

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    guard.textContent = 'Você precisa estar logado. Vá para /login.html.';
    panels.style.display = 'none';
    return;
  }
  guard.style.display = 'none';
  panels.style.display = 'block';
});

document.getElementById('add-news').onclick = async () => {
  const title = document.getElementById('news-title').value.trim();
  const body = document.getElementById('news-body').value.trim();
  const tags = document.getElementById('news-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const msg = document.getElementById('news-msg');
  if (!title || !body) { msg.textContent = 'Preencha título e texto.'; return; }
  msg.textContent = 'Publicando...';
  try {
    await db.collection('news').add({
      title, body, tags,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      author: auth.currentUser.email
    });
    msg.textContent = 'Notícia publicada!';
  } catch (e) { msg.textContent = e.message; }
};

document.getElementById('add-video').onclick = async () => {
  const youtubeId = document.getElementById('video-id').value.trim();
  const title = document.getElementById('video-title').value.trim();
  const msg = document.getElementById('video-msg');
  if (!youtubeId) { msg.textContent = 'Informe o ID do YouTube.'; return; }
  msg.textContent = 'Adicionando...';
  try {
    await db.collection('videos').add({
      youtubeId, title,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      addedBy: auth.currentUser.email
    });
    msg.textContent = 'Vídeo adicionado!';
  } catch (e) { msg.textContent = e.message; }
};

document.getElementById('upload-dl').onclick = async () => {
  const name = document.getElementById('dl-name').value.trim();
  const file = document.getElementById('dl-file').files[0];
  const msg = document.getElementById('dl-msg');
  if (!name || !file) { msg.textContent = 'Informe nome e selecione um arquivo.'; return; }
  msg.textContent = 'Enviando...';
  try {
    const path = `downloads/${Date.now()}_${file.name}`;
    const snap = await storage.ref(path).put(file);
    const url = await snap.ref.getDownloadURL();
    await db.collection('downloads').add({
      name, url, size: file.size,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      addedBy: auth.currentUser.email
    });
    msg.textContent = 'Arquivo enviado!';
  } catch (e) { msg.textContent = e.message; }
};
