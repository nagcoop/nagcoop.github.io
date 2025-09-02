(function() {
  const postsDiv = document.getElementById('posts');
  if (!postsDiv) return;

  function renderPost(doc) {
    const data = doc.data();
    const el = document.createElement('article');
    el.className = 'post';
    const created = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
    const video = data.videoUrl ? `<div><iframe class="video" src="${toEmbed(data.videoUrl)}" allowfullscreen loading="lazy"></iframe></div>` : '';
    el.innerHTML = `
      <h3>${escapeHTML(data.title || 'Sem título')}</h3>
      <small>${created.toLocaleString()}</small>
      <p>${formatBody(data.body || '')}</p>
      ${video}
    `;
    return el;
  }

  function toEmbed(url) {
    // Suporte simples a YouTube; pode ser expandido
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        const id = u.searchParams.get('v');
        return `https://www.youtube.com/embed/${id}`;
      } else if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.replace('/', '');
        return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch(e) {
      return url;
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function formatBody(text) {
    // Markdown mínimo: **negrito**, *itálico*, links [txt](url), quebras de linha
    let t = escapeHTML(text);
    t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
    t = t.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\n/g, '<br/>');
    return t;
  }

  db.collection('posts')
    .where('published', '==', true)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      postsDiv.innerHTML = '';
      if (snap.empty) {
        postsDiv.innerHTML = '<p class="muted">Nenhuma publicação ainda.</p>';
      } else {
        snap.forEach(doc => postsDiv.appendChild(renderPost(doc)));
      }
    }, err => {
      postsDiv.innerHTML = '<p class="muted">Erro ao carregar publicações.</p>';
      console.error(err);
    });
})();
