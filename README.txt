# NAGCOOP • Site Heavy Metal (GitHub Pages)

## Como publicar
1) Faça upload de **todo o conteúdo desta pasta** para a **raiz** do repositório `nagcoop.github.io`.
2) Em Settings → Pages, selecione **Deploy from a branch: main / (root)**.
3) Abra https://nagcoop.github.io

## Firebase
- Edite `js/firebase-config.js` e cole **suas chaves** do Firebase.
- No Firebase Console ative Email/Password, autorize `nagcoop.github.io`, crie usuário admin.
- Cole as **Firestore Rules** e **Storage Rules** do guia.

## Fluxo
- `/login.html` → login
- `/admin.html` → (apenas logado) cadastra notícias, vídeos (YouTube ID) e faz upload de arquivos de download.
- `/` (index) → lista notícias, vídeos e downloads.

## AdSense
- Script global já inserido no `<head>` de todas as páginas.
- Opcional: crie blocos manuais no corpo se quiser.
