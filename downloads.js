(function() {
  const list = document.getElementById('downloadList');
  if (!list) return;

  const ref = storage.ref('downloads');
  ref.listAll()
    .then(async res => {
      if (res.items.length === 0) {
        list.innerHTML = '<li class="muted">Nenhum arquivo disponível.</li>';
        return;
      }
      for (const item of res.items) {
        const url = await item.getDownloadURL();
        const li = document.createElement('li');
        const name = item.name;
        li.innerHTML = `<a href="${url}" target="_blank" rel="noopener">${name}</a>`;
        list.appendChild(li);
      }
    })
    .catch(err => {
      console.error(err);
      list.innerHTML = '<li class="muted">Erro ao carregar a lista de downloads.</li>';
    });
})();
