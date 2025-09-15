// Auto-lista arquivos do GitHub em assets/downloads/
// Uso (no HTML): 
// <script src="/js/gh-downloads.js"></script>
// <script>
//   renderGithubDownloads({ owner:'nagcoop', repo:'nagcoop.github.io', path:'assets/downloads', branch:'main', targetId:'downloads-list' });
// </script>

async function renderGithubDownloads({ owner, repo, path='assets/downloads', branch='main', targetId='downloads-list' }) {
  const target = document.getElementById(targetId);
  if (!target) return;

  // cache simples na sessão
  const cacheKey = `ghdl:${owner}/${repo}/${path}@${branch}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      renderList(data, target);
    }
  } catch {}

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const items = await res.json();
    // só arquivos
    const files = (Array.isArray(items) ? items : []).filter(it => it.type === 'file');

    // ordena por nome A→Z (mude se quiser)
    files.sort((a, b) => a.name.localeCompare(b.name));

    try { sessionStorage.setItem(cacheKey, JSON.stringify(files)); } catch {}

    renderList(files, target);
  } catch (e) {
    target.innerHTML = `<div class="card"><div class="muted">Could not load downloads (${e.message}).</div></div>`;
  }

  function renderList(files, el) {
    el.innerHTML = '';
    if (!files.length) {
      el.innerHTML = `<div class="card"><div class="muted">No files yet.</div></div>`;
      return;
    }
    files.forEach(f => {
      const size = (typeof f.size === 'number' && f.size > 0) ? `(${(f.size/1024/1024).toFixed(2)} MB)` : '';
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <div><strong>${f.name}</strong> <span class="muted">${size}</span></div>
          <a class="btn" href="${f.download_url}" target="_blank" rel="noopener noreferrer">Download</a>
        </div>`;
      el.appendChild(card);
    });
  }
}
