# CETPRO Ernesto Reyna Zegarra - HTML + CSS

Proyecto base estático con interfaces públicas y panel administrativo visual.

## Archivos incluidos

- `index.html`: portada principal.
- `nosotros.html`: página institucional.
- `programas.html`: programas/carreras técnicas.
- `matricula.html`: formulario público de inscripción controlado desde el panel administrador.
- `noticias.html`: noticias y comunicados.
- `galeria.html`: galería institucional.
- `documentos.html`: documentos disponibles.
- `contacto.html`: contacto y formulario.
- `admin.html`: panel visual de administración.
- `styles.css`: estilos globales reutilizables.

## Cómo abrir

1. Descomprime el archivo ZIP.
2. Abre `index.html` en Visual Studio Code.
3. Clic derecho sobre `index.html` y selecciona **Open with Live Server**.

## Nota

Las imágenes están referenciadas desde URLs externas de ejemplo. Para producción, crea una carpeta `assets/img/` y reemplaza las URLs por imágenes propias del CETPRO.


## Versión funcional mejorada

Esta carpeta mantiene el diseño de la primera versión que te gustó y agrega funcionalidad con `script.js`.

### ¿Dónde entra el administrador?

En la portada principal, en la barra azul superior, aparece el botón:

`🔐 Acceso administrador`

También puedes entrar directamente a:

`admin-login.html`

Acceso interno:

- Usuario: `CETPRO`
- Contraseña: `PERUHUARMEY2026`

### Funciones agregadas

- Menú responsive para celular.
- Buscador global desde el ícono de lupa.
- Filtros funcionales en programas, noticias, galería y documentos.
- Buscadores internos funcionales.
- Galería con ventana emergente.
- Botones "Ver más" con modal informativo.
- Botones de documentos con vista previa y descarga demo.
- Formulario de contacto/matrícula con validación.
- Preguntas frecuentes desplegables.
- Panel administrador con guardado local mediante localStorage.

### Nota importante

Esto es frontend estático. Para que el panel admin actualice una web real para todos los usuarios, luego se debe conectar a un backend, base de datos o CMS como Decap CMS, Firebase, Supabase o un sistema propio.


## Cambios solicitados en esta versión

- Se colocó la imagen oficial del CETPRO en el logo superior izquierdo y en el pie de página.
- En la portada, los 5 puntitos del banner cambian automáticamente con una transición suave.
- Se eliminó el enlace “Ver más” de las tarjetas de Programas destacados en Inicio.
- En la página Nosotros, el cuadro grande inicial muestra la imagen del CETPRO enviada.
- Se mantienen los colores, textos, estructura e imágenes de carreras de la versión que gustó.


## Matrícula

El administrador puede habilitar o deshabilitar la matrícula desde `admin.html`. El estado se guarda en `localStorage` para la demostración.


## Últimos ajustes

- El administrador ya no edita Inicio ni Programas.
- En Nosotros, el panel permite agregar, editar y eliminar docentes/directivos.
- En Matrícula, el administrador activa o desactiva el formulario público.
- El formulario de matrícula guarda postulantes en `localStorage` y el panel los muestra por carrera.
- Se eliminó la selección de horario porque el horario ya está definido por carrera.
- El acceso interno queda como candado discreto al final de Inicio.
