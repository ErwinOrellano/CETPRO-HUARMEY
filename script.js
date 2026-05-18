
/* =========================================================
   CETPRO Ernesto Reyna Zegarra - Funcionalidad Front-End
   Mantiene el diseño original y agrega administración simple
   con localStorage para docentes y postulantes.
   ========================================================= */
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
    {title:'Matrícula',url:'matricula.html',desc:'Formulario de inscripción para postulantes'},
    {title:'Noticias',url:'noticias.html',desc:'Semana técnica, aniversario y actividades por carrera'},
    {title:'Galería',url:'galeria.html',desc:'Fotos de talleres, actividades y trabajos de estudiantes'},
    {title:'Documentos',url:'documentos.html',desc:'Reglamentos, formatos, convocatorias y documentos académicos'},
    {title:'Contacto',url:'contacto.html',desc:'Formulario de contacto, ubicación y atención al público'}
  ];

  function getTeachers(){
    const raw=localStorage.getItem('cetpro_teachers');
    if(!raw){ localStorage.setItem('cetpro_teachers',JSON.stringify(defaultTeachers)); return [...defaultTeachers]; }
    try{return JSON.parse(raw)||[]}catch(e){return [...defaultTeachers]}
  }
  function saveTeachers(list){localStorage.setItem('cetpro_teachers',JSON.stringify(list));}
  function getEnrollments(){try{return JSON.parse(localStorage.getItem('cetpro_enrollments')||'[]')}catch(e){return []}}
  function saveEnrollments(list){localStorage.setItem('cetpro_enrollments',JSON.stringify(list));}
  function getMatriculaEnabled(){
    return localStorage.getItem('cetpro_matricula_enabled') !== 'false';
  }
  function setMatriculaEnabled(value){
    localStorage.setItem('cetpro_matricula_enabled', value ? 'true' : 'false');
  }

  function toast(msg){
    const old=$('.toast'); if(old) old.remove();
    const div=document.createElement('div'); div.className='toast'; div.textContent=msg;
    document.body.appendChild(div); setTimeout(()=>div.remove(),3200);
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
    panel.innerHTML=`<div class="search-panel-inner"><div class="flex between"><h2>Buscar en el sitio</h2><button class="modal-close" type="button" style="color:#0b2559">×</button></div><input id="globalSearchInput" placeholder="Ejemplo: matrícula, horarios, documentos, soldadura..."><div class="search-results"></div></div>`;
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
        open(title, `<p>${text}</p><p>Para mayor información puedes comunicarte con la institución o revisar la sección de contacto.</p><a class="btn btn-primary" href="matricula.html">Solicitar matrícula →</a>`);
      }
      const doc=e.target.closest('.doc-table .btn');
      if(doc){
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
    form.addEventListener('submit',e=>{
      e.preventDefault();
      let ok=true; const fields=$$('input,textarea',form);
      fields.forEach(f=>{ const bad=!f.value.trim(); f.classList.toggle('form-error',bad); if(bad) ok=false; });
      const email=fields.find(f=>f.placeholder?.toLowerCase().includes('correo'));
      if(email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)){ email.classList.add('form-error'); ok=false; }
      if(!ok){ toast('Completa correctamente los campos obligatorios.'); return; }
      const messages=JSON.parse(localStorage.getItem('cetpro_messages')||'[]');
      messages.push({fecha:new Date().toLocaleString(),datos:fields.map(f=>f.value)});
      localStorage.setItem('cetpro_messages',JSON.stringify(messages));
      form.reset(); toast('Mensaje registrado correctamente.');
    });
  }

  function setupPublicTeachers(){
    const list=$('#staffList'); if(!list) return;
    const teachers=getTeachers();
    list.innerHTML=teachers.map(t=>`<article class="staff-card card"><div class="avatar"></div><h3>${t.nombre}</h3><p><strong>${t.cargo}</strong><br><span class="muted">${t.area||''}</span></p></article>`).join('') || '<p class="muted">Aún no hay docentes registrados.</p>';
  }

  function setupEnrollment(){
    const openBox=$('#matriculaOpen');
    const closedBox=$('#matriculaClosed');
    if(openBox && closedBox){
      const renderMatriculaState=()=>{
        const enabled = getMatriculaEnabled();
        openBox.hidden = !enabled;
        closedBox.hidden = enabled;
      };
      renderMatriculaState();
      window.addEventListener('storage', e=>{
        if(e.key==='cetpro_matricula_enabled') renderMatriculaState();
      });
    }
    const form=$('#enrollmentForm');
    if(!form) return;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!getMatriculaEnabled()){
        toast('La matrícula está deshabilitada por el administrador.');
        location.reload();
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
      const registros=getEnrollments();
      registros.push({...data, fecha:new Date().toLocaleString(), estado:'Nuevo'});
      saveEnrollments(registros);
      form.reset();
      toast('Inscripción registrada correctamente. El administrador podrá revisarla por carrera.');
    });
  }

  function setupAdmin(){
    if(!document.body.classList.contains('admin-body')) return;
    if(localStorage.getItem('cetpro_logged')!=='1'){ location.href='admin-login.html'; return; }
    $('#logoutBtn')?.addEventListener('click',e=>{
      e.preventDefault();
      localStorage.removeItem('cetpro_logged');
      location.href='admin-login.html';
    });
    const toggle=$('#matriculaToggle');
    const statusText=$('#matriculaStatusText');
    const statusMsg=$('#matriculaAdminMessage');
    const updateStatus=()=>{
      const enabled=toggle ? toggle.checked : getMatriculaEnabled();
      if(statusText) statusText.textContent=enabled?'Activa':'Cerrada';
      if(statusMsg) statusMsg.textContent=enabled?'La página Matrícula mostrará el formulario de inscripción.':'La página Matrícula mostrará un aviso informativo y no recibirá postulantes.';
    };
    if(toggle){
      toggle.checked = getMatriculaEnabled();
      toggle.addEventListener('change',()=>{
        setMatriculaEnabled(toggle.checked);
        updateStatus();
        toast(toggle.checked?'Matrícula habilitada. El formulario público ya está disponible.':'Matrícula deshabilitada. La página pública ya mostrará el aviso informativo.');
      });
      updateStatus();
    }

    const teacherForm=$('#teacherForm');
    const teacherTbody=$('#teachersTable tbody');
    const teacherCount=$('#teacherCount');
    function renderTeachersAdmin(){
      const teachers=getTeachers();
      if(teacherCount) teacherCount.textContent=teachers.length;
      if(!teacherTbody) return;
      teacherTbody.innerHTML=teachers.map((t,i)=>`<tr><td><strong>${t.nombre}</strong></td><td>${t.cargo}</td><td>${t.area||'-'}</td><td><button class="btn btn-outline btn-small" data-edit-teacher="${i}" type="button">Editar</button> <button class="btn btn-primary btn-small" data-delete-teacher="${i}" type="button">Eliminar</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">Aún no hay docentes registrados.</td></tr>';
    }
    if(teacherForm){
      teacherForm.addEventListener('submit',e=>{
        e.preventDefault();
        const data=Object.fromEntries(new FormData(teacherForm).entries());
        if(!data.nombre.trim()||!data.cargo.trim()){toast('Completa nombre y cargo del docente.'); return;}
        const teachers=getTeachers();
        if(data.index!=='') teachers[Number(data.index)]={nombre:data.nombre.trim(),cargo:data.cargo.trim(),area:data.area.trim()};
        else teachers.push({nombre:data.nombre.trim(),cargo:data.cargo.trim(),area:data.area.trim()});
        saveTeachers(teachers); teacherForm.reset(); teacherForm.elements.index.value=''; renderTeachersAdmin(); toast('Docente guardado correctamente.');
      });
      $('#clearTeacherForm')?.addEventListener('click',()=>{teacherForm.reset(); teacherForm.elements.index.value='';});
      teacherTbody?.addEventListener('click',e=>{
        const edit=e.target.closest('[data-edit-teacher]');
        const del=e.target.closest('[data-delete-teacher]');
        const teachers=getTeachers();
        if(edit){const i=Number(edit.dataset.editTeacher), t=teachers[i]; teacherForm.elements.index.value=i; teacherForm.elements.nombre.value=t.nombre; teacherForm.elements.cargo.value=t.cargo; teacherForm.elements.area.value=t.area||''; teacherForm.scrollIntoView({behavior:'smooth',block:'center'});}
        if(del){const i=Number(del.dataset.deleteTeacher); if(confirm('¿Eliminar este docente del sitio web?')){teachers.splice(i,1); saveTeachers(teachers); renderTeachersAdmin(); toast('Docente eliminado.');}}
      });
      renderTeachersAdmin();
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
      enrollTbody.innerHTML=list.map((r,i)=>`<tr><td>${r.fecha||''}</td><td><strong>${r.nombre||''}</strong></td><td>${r.dni||''}</td><td>${r.celular||''}</td><td>${r.correo||'-'}</td><td>${r.carrera||''}</td><td>${r.mensaje||'-'}</td><td><button class="btn btn-outline btn-small" data-delete-enrollment="${i}" type="button">Eliminar</button></td></tr>`).join('') || '<tr><td colspan="8" class="muted">Todavía no hay postulantes registrados.</td></tr>';
    }
    careerFilter?.addEventListener('change',renderEnrollments);
    enrollmentSearch?.addEventListener('input',renderEnrollments);
    enrollTbody?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-delete-enrollment]'); if(!btn) return;
      const current=filteredEnrollments(); const record=current[Number(btn.dataset.deleteEnrollment)];
      const all=getEnrollments(); const idx=all.findIndex(r=>r.fecha===record.fecha && r.dni===record.dni);
      if(idx>-1 && confirm('¿Eliminar este postulante?')){all.splice(idx,1); saveEnrollments(all); renderEnrollments(); toast('Postulante eliminado.');}
    });
    $('#exportEnrollments')?.addEventListener('click',()=>{
      const list=getEnrollments();
      const header='Fecha,Nombre,DNI,Celular,Correo,Carrera,Mensaje\n';
      const rows=list.map(r=>[r.fecha,r.nombre,r.dni,r.celular,r.correo,r.carrera,r.mensaje].map(v=>`"${String(v||'').replaceAll('"','""')}"`).join(',')).join('\n');
      const blob=new Blob([header+rows],{type:'text/csv;charset=utf-8'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='postulantes_cetpro.csv'; a.click(); URL.revokeObjectURL(a.href); toast('Lista descargada.');
    });
    renderEnrollments();
  }

  function setupLogin(){
    const form=$('#loginForm'); if(!form) return;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const user=$('#loginUser').value.trim(); const pass=$('#loginPass').value.trim();
      if(user==='CETPRO' && pass==='PERUHUARMEY2026'){ localStorage.setItem('cetpro_logged','1'); location.href='admin.html'; }
      else toast('Usuario o contraseña incorrectos.');
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    setupMobileMenu(); setupGlobalSearch(); setupFilters(); setupLocalSearchBoxes(); setupModal(); setupFAQ(); setupContactForm(); setupPublicTeachers(); setupEnrollment(); setupAdmin(); setupLogin();
  });
})();
