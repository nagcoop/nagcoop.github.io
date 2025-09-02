// /js/app.js
const adminLink = document.getElementById('admin-link');
const loginLink = document.getElementById('login-link');
const logoutLink = document.getElementById('logout-link');
logoutLink?.addEventListener('click', e => { e.preventDefault(); auth.signOut(); });

auth.onAuthStateChanged(user => {
  if (user) {
    loginLink && (loginLink.style.display = 'none');
    logoutLink && (logoutLink.style.display = 'inline');
    adminLink && (adminLink.style.display = 'inline');
  } else {
    loginLink && (loginLink.style.display = 'inline');
    logoutLink && (logoutLink.style.display = 'none');
    adminLink && (adminLink.style.display = 'none');
  }
});

// Render notícias
const newsList = document.getElementById('news-list');
if (newsList) {
  db.collection('news').orderBy('createdAt','desc').limit(12).onSnapshot(snap => {
    newsList.innerHTML = '';
    snap.forEach(doc => {
      const n = doc.data();
      const el = document.createElement('article');
      el.className = 'card';
      const date = n.createdAt?.toDate?.() || new Date();
      el.innerHTML = `
        <div class="muted" style="font-size:12px;margin-bottom:6px">${date.toLocaleDateString()}</div>
        <h3 style="margin:0 0 6px">${n.title||'Sem título'}</h3>
        <p class="muted" style="margin:0 0 8px">${(n.body||'').slice(0,180)}${(n.body||'').length>180?'…':''}</p>
        <div>${(n.tags||[]).map(t=>`<span class="btn" style="padding:2px 8px;border-radius:9999px">${t}</span>`).join(' ')}</div>`;
      newsList.appendChild(el);
    });
  });
}

// Render vídeos
const videosGrid = document.getElementById('videos-grid');
if (videosGrid) {
  db.collection('videos').orderBy('createdAt','desc').limit(12).onSnapshot(snap => {
    videosGrid.innerHTML = '';
    snap.forEach(doc => {
      const v = doc.data();
      const id = v.youtubeId || 'dQw4w9WgXcQ';
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden">
          <iframe src="https://www.youtube.com/embed/${id}?rel=0" title="${v.title||'Vídeo'}" allowfullscreen
            style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>
        </div>
        <div style="margin-top:8px">${v.title||''}</div>`;
      videosGrid.appendChild(card);
    });
  });
}

// Render downloads
const downloadsList = document.getElementById('downloads-list');
if (downloadsList) {
  db.collection('downloads').orderBy('createdAt','desc').limit(50).onSnapshot(snap => {
    downloadsList.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const card = document.createElement('div');
      card.className = 'card';
      const size = d.size ? `(${(d.size/1024/1024).toFixed(2)} MB)` : '';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <div><strong>${d.name||'Arquivo'}</strong> <span class="muted">${size}</span></div>
          <a class="btn" href="${d.url}" target="_blank" rel="noopener">Baixar</a>
        </div>`;
      downloadsList.appendChild(card);
    });
  });
}
