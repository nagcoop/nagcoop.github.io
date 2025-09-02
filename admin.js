(function() {
  // Protege a página: só entra logado
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      init(user);
    }
  });

  function init(user) {
    // Publicar post
    const postForm = document.getElementById('postForm');
    const title = document.getElementById('title');
    const body = document.getElementById('body');
    const videoUrl = document.getElementById('videoUrl');
    const published = document.getElementById('published');
    const postMsg = document.getElementById('postMsg');

    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      postMsg.textContent = 'Salvando...';
      try {
        await db.collection('posts').add({
          title: title.value.trim(),
          body: body.value.trim(),
          videoUrl: videoUrl.value.trim(),
          published: !!published.checked,
          authorUid: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        postMsg.textContent = 'Publicado!';
        postForm.reset();
        published.checked = true;
      } catch (err) {
        console.error(err);
        postMsg.textContent = 'Erro: ' + err.message;
      }
    });

    // Upload downloads
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const uploadMsg = document.getElementById('uploadMsg');
    const uploadsArea = document.getElementById('uploadsArea');

    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) return;
      uploadMsg.textContent = 'Enviando...';
      const path = `downloads/${Date.now()}-${file.name}`;
      const ref = storage.ref(path);
      try {
        const snap = await ref.put(file);
        const url = await snap.ref.getDownloadURL();
        uploadMsg.textContent = 'Enviado! ';
        const a = document.createElement('a');
        a.href = url; a.textContent = 'Abrir arquivo'; a.target = '_blank'; a.rel = 'noopener';
        uploadsArea.innerHTML = '';
        uploadsArea.appendChild(a);
        fileInput.value = '';
      } catch (err) {
        console.error(err);
        uploadMsg.textContent = 'Erro: ' + err.message;
      }
    });

    // Lista publicações do usuário
    const myPostsDiv = document.getElementById('myPosts');
    db.collection('posts').where('authorUid', '==', user.uid).orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        myPostsDiv.innerHTML = '';
        if (snap.empty) {
          myPostsDiv.innerHTML = '<p class="muted">Você ainda não publicou nada.</p>';
        } else {
          snap.forEach(doc => {
            const d = doc.data();
            const created = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : new Date();
            const el = document.createElement('div');
            el.className = 'post';
            el.innerHTML = `
              <h3>${escapeHTML(d.title || '')}</h3>
              <small>${created.toLocaleString()} — ${d.published ? 'Publicado' : 'Rascunho'}</small>
              <p>${escapeHTML((d.body || '')).slice(0, 160)}...</p>
            `;
            myPostsDiv.appendChild(el);
          });
        }
      });
  }

  function escapeHTML(str) {
    return (str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
})();
