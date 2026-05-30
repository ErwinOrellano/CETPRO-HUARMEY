
/* =========================================================
   CETPRO Ernesto Reyna Zegarra - Funcionalidad Front-End
   Mantiene el diseño original y agrega administración simple
   con Firebase Authentication y Cloud Firestore para todo el contenido dinámico.
   ========================================================= */
import { auth, db, storage } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

(function(){
  const $=(sel,ctx=document)=>ctx.querySelector(sel);
  const $$=(sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));

  const careers=['Mecánica de Producción (Soldadura)','Carpintería','Electricidad','Industria del Vestido'];
  const defaultTeachers=[
    {nombre:'Ing. Juan Carlos Mendoza Silva',cargo:'Director General',area:'Dirección'},
    {nombre:'Lic. Mariela Castañeda Rojas',cargo:'Jefa de Unidad Académica',area:'Gestión académica'},
    {nombre:'Ing. Víctor Hugo Ramírez Palacios',cargo:'Jefe de Área Administrativa',area:'Administración'},
    {nombre:'Lic. Elizabeth Valverde León',cargo:'Coordinadora de Bienestar',area:'Bienestar y Empleabilidad'}
  ];
  const pages=[
    {title:'Inicio',url:'index.html',desc:'Portada principal del CETPRO'},
    {title:'Nosotros',url:'nosotros.html',desc:'Misión, visión, valores y equipo institucional'},
    {title:'Programas',url:'programas.html',desc:'Carreras técnicas: Soldadura, Carpintería, Electricidad e Industria del Vestido'},
    {title:'Inscripción',url:'matricula.html',desc:'Formulario de inscripción para postulantes'},
    {title:'Noticias',url:'noticias.html',desc:'Semana técnica, aniversario y actividades por carrera'},
    {title:'Galería',url:'galeria.html',desc:'Fotos de talleres, actividades y trabajos de estudiantes'},
    {title:'Documentos',url:'documentos.html',desc:'Reglamentos, formatos, convocatorias y documentos académicos'},
    {title:'Contacto',url:'contacto.html',desc:'Formulario de contacto, ubicación y atención al público'}
  ];

  let teachersCache = [];
  let enrollmentsCache = [];
  let inscripcionEnabledCache = true;
  let adminStarted = false;

  function getTeachers(){ return teachersCache; }
  function getEnrollments(){ return enrollmentsCache; }
  function getInscripcionEnabled(){ return inscripcionEnabledCache; }

  async function saveInscripcionEnabled(value){
    await setDoc(doc(db, 'configuracion', 'matricula'), {
      habilitada: Boolean(value),
      mensajeCerrado: 'La inscripción web se encuentra cerrada temporalmente.',
      actualizadoEn: serverTimestamp()
    }, { merge: true });
  }

  function toast(msg){
    const old=$('.toast'); if(old) old.remove();
    const div=document.createElement('div'); div.className='toast'; div.textContent=msg;
    document.body.appendChild(div); setTimeout(()=>div.remove(),3200);
  }


  function escapeHTML(value){
    return String(value||'').replace(/[&<>"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }

  function imageBg(url){
    const clean=String(url||'').trim();
    return clean ? `style="background-image:linear-gradient(180deg,rgba(0,38,93,.05),rgba(0,38,93,.58)),url('${escapeHTML(clean)}')"` : '';
  }

  function thumb(url){
    const clean=String(url||'').trim();
    return clean ? `<img class="admin-thumb" src="${escapeHTML(clean)}" alt="Imagen">` : '<span class="muted">Sin foto</span>';
  }

  function safeFileName(name){
    return String(name||'archivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'_');
  }

  async function uploadSelectedFile(file, folder){
    if(!file || !file.name) return '';
    const fileRef = ref(storage, `${folder}/${Date.now()}_${safeFileName(file.name)}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  async function applyUploadFromInput(form, inputName, targetField, folder, out){
    const input=form.elements[inputName];
    const file=input?.files?.[0];
    if(file){
      toast('Subiendo archivo a Firebase Storage...');
      out[targetField]=await uploadSelectedFile(file, folder);
    }
  }

  function itemFromForm(form, fields){
    const data=Object.fromEntries(new FormData(form).entries());
    const out={actualizadoEn:serverTimestamp()};
    fields.forEach(f=>out[f]=(data[f]||'').trim());
    return {data,out};
  }

  async function saveManaged(collectionName, form, fields, cache){
    const {data,out}=itemFromForm(form, fields);
    try{
      if(collectionName==='noticias') await applyUploadFromInput(form,'imagenArchivo','imagen','noticias',out);
      if(collectionName==='galeria') await applyUploadFromInput(form,'imagenArchivo','imagen','galeria',out);
      if(collectionName==='documentos') await applyUploadFromInput(form,'documentoArchivo','url','documentos',out);

      const required=fields.filter(f=>form.elements[f]?.hasAttribute('required'));
      if(required.some(f=>!out[f])){ toast('Completa los campos obligatorios.'); return; }

      if(collectionName==='galeria' && !out.imagen){ toast('Selecciona una imagen para la galería.'); return; }

      if(data.index!==''){
        const item=cache[Number(data.index)];
        if(item?.id) await updateDoc(doc(db,collectionName,item.id),out);
      }else{
        await addDoc(collection(db,collectionName),{...out,creadoEn:serverTimestamp()});
      }
      form.reset(); form.elements.index.value=''; toast('Información guardada correctamente.');
    }catch(error){ console.error(error); toast('No se pudo guardar. Revisa Firebase Storage y sus reglas.'); }
  }

  function normalizeProgramasMenu(){
    $$('.menu a[href="programas.html"]').forEach(a=>{ a.textContent='Programas'; });
  }

  function setupMobileMenu(){
    const btn=$('.menu-toggle'), menu=$('.menu');
    if(!btn||!menu) return;
    btn.addEventListener('click',()=>menu.classList.toggle('open'));
    menu.addEventListener('click',e=>{ if(e.target.matches('a')) menu.classList.remove('open'); });
  }

  function setupGlobalSearch(){
    const search=$('.search-icon'); if(!search) return;
    const panel=document.createElement('div');
    panel.className='search-panel';
    panel.innerHTML=`<div class="search-panel-inner"><div class="flex between"><h2>Buscar en el sitio</h2><button class="modal-close" type="button" style="color:#0b2559">×</button></div><input id="globalSearchInput" placeholder="Ejemplo: inscripción, horarios, documentos, soldadura..."><div class="search-results"></div></div>`;
    document.body.appendChild(panel);
    const input=$('#globalSearchInput',panel), results=$('.search-results',panel);
    const render=(q='')=>{
      const query=q.toLowerCase().trim();
      const found=pages.filter(p=>(p.title+' '+p.desc).toLowerCase().includes(query));
      results.innerHTML=(query?found:pages).map(p=>`<a href="${p.url}"><strong>${p.title}</strong><br><span class="muted">${p.desc}</span></a>`).join('') || '<div class="no-results">No se encontraron resultados.</div>';
    };
    search.addEventListener('click',e=>{e.preventDefault(); panel.classList.add('show'); render(); setTimeout(()=>input.focus(),80);});
    $('.modal-close',panel).addEventListener('click',()=>panel.classList.remove('show'));
    panel.addEventListener('click',e=>{if(e.target===panel) panel.classList.remove('show')});
    input.addEventListener('input',()=>render(input.value));
  }

  function setupFilters(){
    $$('.filters').forEach(group=>{
      group.addEventListener('click',e=>{
        const btn=e.target.closest('.filter'); if(!btn) return;
        $$('.filter',group).forEach(b=>b.classList.remove('active')); btn.classList.add('active');
        const text=btn.textContent.toLowerCase().replace(/[▦▤📣🗓👥⚖📁🎓📜]/g,'').trim();
        const root=group.closest('main')||document;
        const cards=$$('.program-card,.mini-news,.news-feature,.gallery-item,.doc-table tbody tr',root);
        if(!cards.length) return;
        let visible=0;
        cards.forEach(card=>{
          const hay=card.textContent.toLowerCase();
          const show=text==='todos' || text==='' || hay.includes(text) || (text==='industria' && hay.includes('soldadura')) || (text==='tecnología' && hay.includes('electricidad'));
          card.classList.toggle('hidden-by-filter',!show); if(show) visible++;
        });
        const existing=$('.no-results',root); if(existing) existing.remove();
        if(!visible){ const n=document.createElement('div'); n.className='no-results'; n.textContent='No hay elementos para este filtro.'; group.parentElement.appendChild(n); }
      });
    });
  }

  function setupLocalSearchBoxes(){
    $$('.search-box input').forEach(input=>{
      input.addEventListener('input',()=>{
        const q=input.value.toLowerCase().trim();
        const root=input.closest('main')||document;
        const cards=$$('.program-card,.mini-news,.news-feature,.gallery-item,.doc-table tbody tr',root);
        cards.forEach(card=>card.classList.toggle('hidden-by-filter', q && !card.textContent.toLowerCase().includes(q)));
      });
    });
  }

  function setupModal(){
    const overlay=document.createElement('div'); overlay.className='modal-overlay';
    overlay.innerHTML='<div class="modal-box"><div class="modal-head"><h2></h2><button class="modal-close" type="button">×</button></div><div class="modal-body"></div></div>';
    document.body.appendChild(overlay);
    const open=(title,body)=>{ $('.modal-head h2',overlay).textContent=title; $('.modal-body',overlay).innerHTML=body; overlay.classList.add('show'); };
    $('.modal-close',overlay).addEventListener('click',()=>overlay.classList.remove('show'));
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.classList.remove('show'); });

    document.addEventListener('click',e=>{
      const read=e.target.closest('.read-more,.mini-news .btn,.news-feature .btn,.program-card .btn');
      if(read){
        const card=read.closest('.program-card,.mini-news,.news-feature,.program-body,.program-card');
        if(read.getAttribute('href') && read.getAttribute('href')!=='#') return;
        e.preventDefault();
        const title=(card?.querySelector('h2,h3')?.textContent||'Información').trim();
        const text=(card?.querySelector('p')?.textContent||'Información ampliada del CETPRO.').trim();
        open(title, `<p>${text}</p><p>Para mayor información puedes comunicarte con la institución o revisar la sección de contacto.</p><a class="btn btn-primary" href="matricula.html">Solicitar inscripción →</a>`);
      }
      const doc=e.target.closest('.doc-table .btn');
      if(doc){
        const href=doc.getAttribute('href');
        if(href && href!=='#') return;
        e.preventDefault();
        const row=doc.closest('tr'); const title=row?.querySelector('.doc-name div')?.childNodes[0]?.textContent?.trim()||'Documento';
        if(doc.textContent.includes('Descargar')){
          const blob=new Blob([`CETPRO Ernesto Reyna Zegarra\n\n${title}\n\nDocumento de demostración para el sitio web.`],{type:'text/plain'});
          const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=title.replaceAll(' ','_')+'.txt'; a.click(); URL.revokeObjectURL(a.href); toast('Descarga de demostración iniciada.');
        }else open(title, `<p>Vista previa de demostración del documento: <strong>${title}</strong>.</p><p>En producción aquí se abrirá el PDF o DOC oficial cargado por el administrador.</p>`);
      }
      const gal=e.target.closest('.gallery-item');
      if(gal){
        const title=gal.querySelector('h3')?.textContent||'Galería'; const desc=gal.querySelector('p')?.textContent||'';
        open(title, `<div style="height:280px;border-radius:14px;background:linear-gradient(135deg,#07356d,#63a7d8);display:grid;place-items:center;color:white;font-size:3rem">🖼</div><p>${desc}</p>`);
      }
    });
  }

  function setupFAQ(){
    $$('.faq-card').forEach((card,i)=>{
      card.addEventListener('click',()=>{
        const answers=['Puedes comunicarte por el formulario de contacto o acercarte al local institucional con tus documentos.','Generalmente se solicita DNI, ficha de inscripción y requisitos indicados por la institución.','Sí, la formación está orientada a competencias y certificación según el programa.','Sí, puedes solicitar información para coordinar una visita a los talleres.'];
        card.classList.toggle('open');
        let ans=card.querySelector('.answer');
        if(!ans){ ans=document.createElement('span'); ans.className='answer'; ans.textContent=answers[i]||'Comunícate con la institución para más información.'; card.appendChild(ans); }
        else ans.remove();
      });
    });
  }

  function setupContactForm(){
    const form=$('form.contact-form'); if(!form) return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      let ok=true; const fields=$$('input,textarea',form);
      fields.forEach(f=>{ const bad=!f.value.trim(); f.classList.toggle('form-error',bad); if(bad) ok=false; });
      const email=fields.find(f=>f.placeholder?.toLowerCase().includes('correo'));
      if(email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)){ email.classList.add('form-error'); ok=false; }
      if(!ok){ toast('Completa correctamente los campos obligatorios.'); return; }

      try{
        await addDoc(collection(db,'mensajes'),{
          fechaTexto:new Date().toLocaleString(),
          creadoEn:serverTimestamp(),
          datos:fields.map(f=>f.value.trim())
        });
        form.reset(); toast('Mensaje enviado correctamente.');
      }catch(error){
        console.error(error);
        toast('No se pudo enviar el mensaje. Revisa tu conexión o las reglas de Firebase.');
      }
    });
  }

  function setupPublicTeachers(){
    const list=$('#staffList'); if(!list) return;
    onSnapshot(collection(db,'docentes'), snapshot=>{
      teachersCache = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      list.innerHTML=teachersCache.map(t=>`<article class="staff-card card"><div class="avatar" ${imageBg(t.foto)}></div><h3>${escapeHTML(t.nombre)}</h3><p><strong>${escapeHTML(t.cargo)}</strong><br><span class="muted">${escapeHTML(t.area)}</span></p></article>`).join('') || '<p class="muted">Aún no hay docentes registrados.</p>';
    }, error=>{
      console.error(error);
      list.innerHTML='<p class="muted">No se pudieron cargar los docentes.</p>';
    });
  }

  function setupEnrollment(){
    const openBox=$('#inscripcionOpen');
    const closedBox=$('#inscripcionClosed');

    if(openBox && closedBox){
      const renderInscripciónState=()=>{
        const enabled = getInscripcionEnabled();
        openBox.hidden = !enabled;
        closedBox.hidden = enabled;
      };

      onSnapshot(doc(db,'configuracion','matricula'), snapshot=>{
        const data=snapshot.data()||{};
        inscripcionEnabledCache = data.habilitada !== false;
        renderInscripciónState();
      }, error=>{
        console.error(error);
        toast('No se pudo leer el estado de inscripción.');
      });
    }

    const form=$('#enrollmentForm');
    if(!form) return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!getInscripcionEnabled()){
        toast('La inscripción está deshabilitada por el administrador.');
        return;
      }
      const data=Object.fromEntries(new FormData(form).entries());
      let ok=true;
      $$('input,select,textarea',form).forEach(f=>f.classList.remove('form-error'));
      ['nombre','dni','celular','carrera'].forEach(name=>{
        const el=form.elements[name];
        if(!String(data[name]||'').trim()){ el.classList.add('form-error'); ok=false; }
      });
      if(data.dni && !/^\d{8}$/.test(data.dni)){ form.elements.dni.classList.add('form-error'); ok=false; }
      if(data.celular && !/^9\d{8}$/.test(data.celular)){ form.elements.celular.classList.add('form-error'); ok=false; }
      if(data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)){ form.elements.correo.classList.add('form-error'); ok=false; }
      if(!ok){ toast('Revisa los datos: DNI 8 dígitos y celular peruano de 9 dígitos.'); return; }

      try{
        await addDoc(collection(db,'postulantes'),{
          nombre:data.nombre.trim(),
          dni:data.dni.trim(),
          celular:data.celular.trim(),
          correo:(data.correo||'').trim(),
          carrera:data.carrera,
          mensaje:(data.mensaje||'').trim(),
          estado:'Nuevo',
          fechaTexto:new Date().toLocaleString(),
          creadoEn:serverTimestamp()
        });
        form.reset();
        toast('Inscripción registrada correctamente. El administrador podrá revisarla por carrera.');
      }catch(error){
        console.error(error);
        toast('No se pudo registrar la inscripción. Revisa tu conexión.');
      }
    });
  }


  function setupPublicManagedContent(){
    const newsList=$('.news-list');
    if(newsList){
      onSnapshot(collection(db,'noticias'), snapshot=>{
        const items=snapshot.docs.map(d=>({id:d.id,...d.data()}));
        if(!items.length) return;
        newsList.innerHTML=items.map(n=>`<article class="mini-news card"><div class="program-img" data-label="${escapeHTML(n.categoria||'Noticia')}" ${imageBg(n.imagen)}></div><h3>${escapeHTML(n.titulo)}</h3><p>${escapeHTML(n.resumen)}</p><div class="mini-meta muted">${escapeHTML(n.fecha||'')}</div><a class="btn btn-outline">Leer más →</a></article>`).join('');
      }, error=>console.error(error));
    }

    const galleryGrid=$('.gallery-grid');
    if(galleryGrid){
      onSnapshot(collection(db,'galeria'), snapshot=>{
        const items=snapshot.docs.map(d=>({id:d.id,...d.data()}));
        if(!items.length) return;
        galleryGrid.innerHTML=items.map(g=>`<article class="gallery-item card"><div class="gallery-photo" data-gallery="${escapeHTML(g.categoria||'Galería')}" ${imageBg(g.imagen)}></div><h3>${escapeHTML(g.titulo)}</h3><p>${escapeHTML(g.descripcion||g.categoria||'')}</p></article>`).join('');
      }, error=>console.error(error));
    }

    const docBody=$('.doc-table tbody');
    if(docBody){
      onSnapshot(collection(db,'documentos'), snapshot=>{
        const items=snapshot.docs.map(d=>({id:d.id,...d.data()}));
        if(!items.length) return;
        docBody.innerHTML=items.map(d=>`<tr><td><div class="doc-name"><span class="file-icon ${String(d.tipo||'').toLowerCase().includes('doc')?'doc':''}">${escapeHTML((d.tipo||'PDF').slice(0,3).toUpperCase())}</span><div>${escapeHTML(d.nombre)}<br><span class="badge">${escapeHTML(d.tipo||'Documento')}</span></div></div></td><td>${escapeHTML(d.descripcion)}</td><td>${escapeHTML(d.fecha||'')}</td><td><span class="type-pill">${escapeHTML(d.tipo||'PDF')}</span></td><td>${d.url?`<a class="btn btn-outline" href="${escapeHTML(d.url)}" target="_blank" rel="noopener">👁 Ver</a> <a class="btn btn-primary" href="${escapeHTML(d.url)}" target="_blank" rel="noopener">⬇ Descargar</a>`:'<span class="muted">Sin enlace</span>'}</td></tr>`).join('');
      }, error=>console.error(error));
    }
  }

  function setupAdmin(){
    if(!document.body.classList.contains('admin-body')) return;

    onAuthStateChanged(auth, user=>{
      if(!user){ location.href='admin-login.html'; return; }
      if(adminStarted) return;
      adminStarted = true;
      iniciarPanelAdmin();
    });
  }

  function iniciarPanelAdmin(){
    $('#logoutBtn')?.addEventListener('click',async e=>{
      e.preventDefault();
      await signOut(auth);
      location.href='admin-login.html';
    });

    const toggle=$('#inscripcionToggle');
    const statusText=$('#inscripcionStatusText');
    const statusMsg=$('#inscripcionAdminMessage');

    const updateStatus=()=>{
      const enabled=toggle ? toggle.checked : getInscripcionEnabled();
      if(statusText) statusText.textContent=enabled?'Activa':'Cerrada';
      if(statusMsg) statusMsg.textContent=enabled?'La página Inscripción mostrará el formulario de inscripción.':'La página Inscripción mostrará un aviso informativo y no recibirá postulantes.';
    };

    if(toggle){
      onSnapshot(doc(db,'configuracion','matricula'), snapshot=>{
        const data=snapshot.data()||{};
        inscripcionEnabledCache = data.habilitada !== false;
        toggle.checked = inscripcionEnabledCache;
        updateStatus();
      }, error=>{
        console.error(error);
        toast('No se pudo cargar el estado de inscripción.');
      });

      toggle.addEventListener('change',async ()=>{
        try{
          await saveInscripcionEnabled(toggle.checked);
          updateStatus();
          toast(toggle.checked?'Inscripción habilitada. El formulario público ya está disponible.':'Inscripción deshabilitada. La página pública ya mostrará el aviso informativo.');
        }catch(error){
          console.error(error);
          toast('No se pudo cambiar el estado de inscripción.');
        }
      });
    }

    const teacherForm=$('#teacherForm');
    const teacherTbody=$('#teachersTable tbody');
    const teacherCount=$('#teacherCount');

    function renderTeachersAdmin(){
      const teachers=getTeachers();
      if(teacherCount) teacherCount.textContent=teachers.length;
      if(!teacherTbody) return;
      teacherTbody.innerHTML=teachers.map((t,i)=>`<tr><td>${thumb(t.foto)}</td><td><strong>${escapeHTML(t.nombre)}</strong></td><td>${escapeHTML(t.cargo)}</td><td>${escapeHTML(t.area)||'-'}</td><td><button class="btn btn-outline btn-small" data-edit-teacher="${i}" type="button">Editar</button> <button class="btn btn-primary btn-small" data-delete-teacher="${i}" type="button">Eliminar</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Aún no hay docentes registrados.</td></tr>';
    }

    onSnapshot(collection(db,'docentes'), snapshot=>{
      teachersCache = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      renderTeachersAdmin();
    }, error=>{
      console.error(error);
      toast('No se pudieron cargar los docentes.');
    });

    if(teacherForm){
      teacherForm.addEventListener('submit',async e=>{
        e.preventDefault();
        const data=Object.fromEntries(new FormData(teacherForm).entries());
        if(!data.nombre.trim()||!data.cargo.trim()){toast('Completa nombre y cargo del docente.'); return;}
        const docente={
          nombre:data.nombre.trim(),
          cargo:data.cargo.trim(),
          area:(data.area||'').trim(),
          foto:(data.foto||'').trim(),
          actualizadoEn:serverTimestamp()
        };
        try{
          const fotoNueva = teacherForm.elements.fotoArchivo?.files?.[0];
          if(fotoNueva){
            toast('Subiendo foto del docente a Firebase Storage...');
            docente.foto = await uploadSelectedFile(fotoNueva, 'docentes');
          }
          if(data.index!==''){
            const teacher=teachersCache[Number(data.index)];
            if(teacher?.id) await updateDoc(doc(db,'docentes',teacher.id),docente);
          }else{
            await addDoc(collection(db,'docentes'),{...docente,creadoEn:serverTimestamp()});
          }
          teacherForm.reset();
          teacherForm.elements.index.value='';
          toast('Docente guardado correctamente.');
        }catch(error){
          console.error(error);
          toast('No se pudo guardar el docente.');
        }
      });

      $('#clearTeacherForm')?.addEventListener('click',()=>{teacherForm.reset(); teacherForm.elements.index.value='';});

      teacherTbody?.addEventListener('click',async e=>{
        const edit=e.target.closest('[data-edit-teacher]');
        const del=e.target.closest('[data-delete-teacher]');

        if(edit){
          const i=Number(edit.dataset.editTeacher), t=teachersCache[i];
          if(!t) return;
          teacherForm.elements.index.value=i;
          teacherForm.elements.nombre.value=t.nombre||'';
          teacherForm.elements.cargo.value=t.cargo||'';
          teacherForm.elements.area.value=t.area||'';
          teacherForm.elements.foto.value=t.foto||'';
          if(teacherForm.elements.fotoArchivo) teacherForm.elements.fotoArchivo.value='';
          teacherForm.scrollIntoView({behavior:'smooth',block:'center'});
        }

        if(del){
          const i=Number(del.dataset.deleteTeacher), t=teachersCache[i];
          if(t?.id && confirm('¿Eliminar este docente del sitio web?')){
            try{
              await deleteDoc(doc(db,'docentes',t.id));
              toast('Docente eliminado.');
            }catch(error){
              console.error(error);
              toast('No se pudo eliminar el docente.');
            }
          }
        }
      });
    }

    const enrollTbody=$('#enrollmentsTable tbody');
    const enrollCount=$('#enrollmentCount');
    const careerFilter=$('#careerFilter');
    const enrollmentSearch=$('#enrollmentSearch');
    const careerCounts=$('#careerCounts');

    function filteredEnrollments(){
      const q=(enrollmentSearch?.value||'').toLowerCase().trim();
      const c=careerFilter?.value||'';
      return getEnrollments().filter(r=>(!c||r.carrera===c) && (!q || Object.values(r).join(' ').toLowerCase().includes(q)));
    }

    function renderEnrollments(){
      const all=getEnrollments();
      if(enrollCount) enrollCount.textContent=all.length;
      if(careerCounts){
        careerCounts.innerHTML=careers.map(c=>`<article class="card career-count-card"><strong>${all.filter(r=>r.carrera===c).length}</strong><span>${c}</span></article>`).join('');
      }
      if(!enrollTbody) return;
      const list=filteredEnrollments();
      enrollTbody.innerHTML=list.map((r,i)=>`<tr><td>${r.fechaTexto||r.fecha||''}</td><td><strong>${r.nombre||''}</strong></td><td>${r.dni||''}</td><td>${r.celular||''}</td><td>${r.correo||'-'}</td><td>${r.carrera||''}</td><td>${r.mensaje||'-'}</td><td><button class="btn btn-outline btn-small" data-delete-enrollment="${i}" type="button">Eliminar</button></td></tr>`).join('') || '<tr><td colspan="8" class="muted">Todavía no hay postulantes registrados.</td></tr>';
    }

    onSnapshot(collection(db,'postulantes'), snapshot=>{
      enrollmentsCache = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      renderEnrollments();
    }, error=>{
      console.error(error);
      toast('No se pudieron cargar los postulantes.');
    });

    careerFilter?.addEventListener('change',renderEnrollments);
    enrollmentSearch?.addEventListener('input',renderEnrollments);

    enrollTbody?.addEventListener('click',async e=>{
      const btn=e.target.closest('[data-delete-enrollment]'); if(!btn) return;
      const current=filteredEnrollments(); const record=current[Number(btn.dataset.deleteEnrollment)];
      if(record?.id && confirm('¿Eliminar este postulante?')){
        try{
          await deleteDoc(doc(db,'postulantes',record.id));
          toast('Postulante eliminado.');
        }catch(error){
          console.error(error);
          toast('No se pudo eliminar el postulante.');
        }
      }
    });

    $('#exportEnrollments')?.addEventListener('click',()=>{
      const list=getEnrollments();
      const header='Fecha,Nombre,DNI,Celular,Correo,Carrera,Mensaje\n';
      const rows=list.map(r=>[r.fechaTexto||r.fecha||'',r.nombre,r.dni,r.celular,r.correo,r.carrera,r.mensaje].map(v=>`"${String(v||'').replaceAll('"','""')}"`).join(',')).join('\n');
      const blob=new Blob([header+rows],{type:'text/csv;charset=utf-8'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='postulantes_cetpro.csv'; a.click(); URL.revokeObjectURL(a.href); toast('Lista descargada.');
    });

    setupManagedAdmin();
  }

  function setupManagedAdmin(){
    let newsCache=[], galleryCache=[], documentsCache=[];

    const setupTable=(collectionName, formSel, tableSel, fields, renderRow, clearSel)=>{
      const form=$(formSel), tbody=$(`${tableSel} tbody`); if(!form||!tbody) return;
      onSnapshot(collection(db,collectionName), snapshot=>{
        const cache=snapshot.docs.map(d=>({id:d.id,...d.data()}));
        if(collectionName==='noticias') newsCache=cache;
        if(collectionName==='galeria') galleryCache=cache;
        if(collectionName==='documentos') documentsCache=cache;
        tbody.innerHTML=cache.map(renderRow).join('') || `<tr><td colspan="6" class="muted">Aún no hay registros.</td></tr>`;
      }, error=>{ console.error(error); toast('No se pudieron cargar los registros.'); });

      form.addEventListener('submit',async e=>{
        e.preventDefault();
        const cache=collectionName==='noticias'?newsCache:(collectionName==='galeria'?galleryCache:documentsCache);
        await saveManaged(collectionName, form, fields, cache);
      });
      $(clearSel)?.addEventListener('click',()=>{form.reset(); form.elements.index.value='';});
      tbody.addEventListener('click',async e=>{
        const edit=e.target.closest('[data-edit-managed]');
        const del=e.target.closest('[data-delete-managed]');
        const cache=collectionName==='noticias'?newsCache:(collectionName==='galeria'?galleryCache:documentsCache);
        if(edit){
          const item=cache[Number(edit.dataset.editManaged)]; if(!item) return;
          form.elements.index.value=edit.dataset.editManaged;
          fields.forEach(f=>{ if(form.elements[f]) form.elements[f].value=item[f]||''; });
          ['imagenArchivo','documentoArchivo'].forEach(n=>{ if(form.elements[n]) form.elements[n].value=''; });
          form.scrollIntoView({behavior:'smooth',block:'center'});
        }
        if(del){
          const item=cache[Number(del.dataset.deleteManaged)];
          if(item?.id && confirm('¿Eliminar este registro del sitio web?')){
            try{ await deleteDoc(doc(db,collectionName,item.id)); toast('Registro eliminado.'); }
            catch(error){ console.error(error); toast('No se pudo eliminar el registro.'); }
          }
        }
      });
    };

    setupTable('noticias','#newsForm','#newsTable',['titulo','categoria','fecha','imagen','resumen'],(n,i)=>`<tr><td>${thumb(n.imagen)}</td><td><strong>${escapeHTML(n.titulo)}</strong><br><span class="muted">${escapeHTML(n.resumen||'')}</span></td><td>${escapeHTML(n.categoria||'-')}</td><td>${escapeHTML(n.fecha||'-')}</td><td><button class="btn btn-outline btn-small" data-edit-managed="${i}" type="button">Editar</button> <button class="btn btn-primary btn-small" data-delete-managed="${i}" type="button">Eliminar</button></td></tr>`,'#clearNewsForm');

    setupTable('galeria','#galleryForm','#galleryTable',['titulo','categoria','imagen','descripcion'],(g,i)=>`<tr><td>${thumb(g.imagen)}</td><td><strong>${escapeHTML(g.titulo)}</strong></td><td>${escapeHTML(g.categoria||'-')}</td><td>${escapeHTML(g.descripcion||'-')}</td><td><button class="btn btn-outline btn-small" data-edit-managed="${i}" type="button">Editar</button> <button class="btn btn-primary btn-small" data-delete-managed="${i}" type="button">Eliminar</button></td></tr>`,'#clearGalleryForm');

    setupTable('documentos','#documentForm','#managedDocumentsTable',['nombre','tipo','fecha','url','descripcion'],(d,i)=>`<tr><td><strong>${escapeHTML(d.nombre)}</strong></td><td>${escapeHTML(d.descripcion||'-')}</td><td>${escapeHTML(d.fecha||'-')}</td><td>${escapeHTML(d.tipo||'-')}</td><td><button class="btn btn-outline btn-small" data-edit-managed="${i}" type="button">Editar</button> <button class="btn btn-primary btn-small" data-delete-managed="${i}" type="button">Eliminar</button></td></tr>`,'#clearDocumentForm');
  }

  function setupLogin(){
    const form=$('#loginForm'); if(!form) return;

    const userInput=$('#loginUser');
    if(userInput){
      userInput.placeholder='Correo electrónico';
      userInput.type='email';
      userInput.value='huarmey@cetpro.com';
    }

    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const email=$('#loginUser').value.trim();
      const pass=$('#loginPass').value.trim();

      try{
        await signInWithEmailAndPassword(auth,email,pass);
        location.href='admin.html';
      }catch(error){
        console.error(error);
        toast('Correo o contraseña incorrectos.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    normalizeProgramasMenu(); setupMobileMenu(); setupGlobalSearch(); setupFilters(); setupLocalSearchBoxes(); setupModal(); setupFAQ(); setupContactForm(); setupPublicTeachers(); setupPublicManagedContent(); setupEnrollment(); setupAdmin(); setupLogin();
  });
})();
