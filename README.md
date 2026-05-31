# CETPRO Ernesto Reyna Zegarra - Firebase gratis + GitHub para archivos

Este proyecto mantiene el diseño original del sitio web y evita Firebase Storage para no usar el plan Blaze.

## Qué usa

- Firebase Authentication: ingreso del administrador.
- Cloud Firestore: textos, docentes, inscripción, postulantes, noticias, galería, documentos y mensajes.
- GitHub API mediante Vercel Functions: subir y eliminar fotos/documentos desde el panel web.
- GitHub Pages: publicación del sitio web.

## Archivos nuevos importantes

- `github-api-config.js`: aquí se coloca la URL del proyecto publicado en Vercel.
- `api/upload-github.js`: sube archivos al repositorio de GitHub.
- `api/delete-github.js`: elimina archivos del repositorio de GitHub.
- `package.json`: permite que Vercel instale `firebase-admin`.

## Variables que debes configurar en Vercel

```env
GITHUB_OWNER=erwinorellano
GITHUB_REPO=CETPRO-HUARMEY
GITHUB_BRANCH=main
GITHUB_TOKEN=TU_TOKEN_FINE_GRAINED_DE_GITHUB
ADMIN_EMAILS=huarmey@cetpro.com
FIREBASE_PROJECT_ID=TU_PROJECT_ID_DE_FIREBASE
FIREBASE_CLIENT_EMAIL=TU_CLIENT_EMAIL_DEL_SERVICE_ACCOUNT
FIREBASE_PRIVATE_KEY=TU_PRIVATE_KEY_DEL_SERVICE_ACCOUNT
ALLOWED_ORIGIN=https://erwinorellano.github.io
```

## Importante

Después de publicar el proyecto en Vercel, copia la URL que te da Vercel y colócala en `github-api-config.js`.

Ejemplo:

```js
export const GITHUB_FILES_API_BASE = "https://cetpro-huarmey-api.vercel.app";
```

## Carpetas para archivos

Los archivos subidos desde el panel se guardan automáticamente en:

- `assets/docentes/`
- `assets/noticias/`
- `assets/galeria/`
- `assets/documentos/`

Cuando eliminas un docente, noticia, imagen de galería o documento desde el panel, también se intenta eliminar su archivo correspondiente del repositorio de GitHub.
