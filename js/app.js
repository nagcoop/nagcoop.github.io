// app placeholder
// Toggle de login/logout e link Admin
const adminLink = document.getElementById('admin-link');
const loginLink  = document.getElementById('login-link');
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

// ======= NEWS =======
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
        <h3 style="margin:0 0 6px">${n.title || 'Untitled'}</h3>
        <p class="muted" style="margin:0 0 8px">${(n.body || '').slice(0,180)}${(n.body||'').length>180?'…':''}</p>
        <div>${(n.tags || []).map(t=>`<span class="btn" style="padding:2px 8px;border-radius:9999px">${t}</span>`).join(' ')}</div>`;
      newsList.appendChild(el);
    });
  });
}

// ======= VIDEOS GRID =======
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
          <iframe src="https://www.youtube.com/embed/${id}?rel=0"
                  title="${v.title || 'Video'}" allowfullscreen
                  style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>
        </div>
        <div style="margin-top:8px">${v.title || ''}</div>`;
      videosGrid.appendChild(card);
    });
  });
}

// ======= FEATURED ALEATÓRIO =======
// Pega até 50 vídeos da coleção "videos" e sorteia 1 para o destaque do topo
const featEl = document.getElementById('featured-video');
if (featEl) {
  db.collection('videos').orderBy('createdAt','desc').limit(50).get()
    .then(snap => {
      const ids = [];
      snap.forEach(doc => {
        const v = doc.data();
        if (v.youtubeId) ids.push(v.youtubeId);
      });
      if (ids.length) {
        const pick = ids[Math.floor(Math.random() * ids.length)];
        featEl.src = `https://www.youtube.com/embed/${pick}?rel=0`;
      } else {
        console.warn('Nenhum vídeo cadastrado em /admin ainda para o destaque.');
        // mantém o src que já está no HTML como fallback
      }
    })
    .catch(err => console.error('Erro ao buscar vídeos para destaque:', err));
}

// ======= DOWNLOADS =======
// ======= DOWNLOADS =======
const downloadsList = document.getElementById('downloads-list');
if (downloadsList) {
  db.collection('downloads').orderBy('createdAt','desc').limit(50).onSnapshot(snap => {
    downloadsList.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const isMagnet = typeof d.url === 'string' && d.url.startsWith('magnet:');
      const isTorrent = typeof d.url === 'string' && d.url.toLowerCase().endsWith('.torrent');
      const badge = isMagnet ? 'Magnet' : (isTorrent ? 'Torrent' : 'File');

      const size = d.size ? `(${(d.size/1024/1024).toFixed(2)} MB)` : '';
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <div>
            <strong>${d.name || 'File'}</strong>
            <span class="muted">${size}</span>
            <span class="btn" style="padding:2px 8px;border-radius:9999px;margin-left:6px">${badge}</span>
          </div>
          <a class="btn" href="${d.url}" target="_blank" rel="noopener noreferrer">
            ${isMagnet ? 'Open magnet' : 'Download'}
          </a>
        </div>`;
      downloadsList.appendChild(card);
    });
  });
}

    
