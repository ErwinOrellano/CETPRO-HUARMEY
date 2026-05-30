# CETPRO Ernesto Reyna Zegarra - Firebase completo

Este proyecto mantiene el diseño original del sitio web, pero el contenido administrable está preparado para trabajar con **Firebase Authentication**, **Cloud Firestore** y **Firebase Storage**.

## Cambios principales

- El menú superior mantiene siempre la opción **Programas**.
- En el sitio público se cambió **Inscripción** por **Inscripción**.
- El formulario público se mantiene en `matricula.html`, pero visualmente aparece como **Inscripción**.
- No se agregó otro archivo de inscripción; se conserva `matricula.html` para no romper Firebase ni enlaces existentes.
- El panel interno ya no usa guardado local para el contenido administrable.

## Panel interno

Desde `admin.html`, el personal autorizado puede administrar:

- Docentes: agregar, editar, eliminar y subir foto desde la computadora.
- Inscripción: activar o desactivar el formulario público.
- Postulantes: revisar postulantes registrados por carrera.
- Noticias: agregar, editar, eliminar y subir imagen desde la computadora.
- Galería: agregar, eliminar y subir fotos desde la computadora.
- Documentos: agregar, editar, eliminar y subir archivos PDF, Word, Excel, PowerPoint o imágenes desde la computadora.

## Firebase usado

### Firestore

Colecciones/documentos usados:

- `docentes`
- `postulantes`
- `noticias`
- `galeria`
- `documentos`
- `mensajes`
- `configuracion / matricula`

### Storage

Carpetas usadas:

- `docentes/`
- `noticias/`
- `galeria/`
- `documentos/`

Cuando el administrador selecciona una foto o archivo, el sistema lo sube a Firebase Storage y guarda el enlace automático en Firestore.

## Importante

Debes tener habilitado Firebase Storage en tu proyecto Firebase y configurar reglas que permitan subir archivos al usuario administrador autenticado.
