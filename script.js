function validarRut(rut){
  if(!rut) return false;
  rut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if(rut.length < 2) return false;
  var cuerpo = rut.slice(0, -1);
  var dv = rut.slice(-1);
  if(!/^[0-9]+$/.test(cuerpo)) return false;
  var suma = 0;
  var multiplo = 2;
  for(var i=cuerpo.length-1;i>=0;i--){
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    multiplo = multiplo == 7 ? 2 : multiplo + 1;
  }
  var resultado = 11 - (suma % 11);
  var dvEsperado = resultado == 11 ? '0' : resultado == 10 ? 'K' : resultado.toString();
  return dv === dvEsperado;
}
function normalizeRut(rut){return rut.replace(/\./g,'').replace(/-/g,'').toUpperCase();}
function showMessage(text,type='success'){
  var box = document.getElementById('feedback');
  box.className = 'msg '+(type==='success'?'success':'error');
  box.style.display = 'block';
  box.textContent = text;
  setTimeout(()=>{box.style.display='none'},4000);
}
function loadRecords(){try{return JSON.parse(localStorage.getItem('ficha_medica_records')||'{}');}catch(e){return {};}}
function saveRecords(obj){localStorage.setItem('ficha_medica_records', JSON.stringify(obj));}
function validateForm(data){
  if(!validarRut(data.rut)) return 'Rut inválido. Formato ejemplo: 12.345.678-5';
  if(!data.nombres.trim()) return 'Debe ingresar nombres.';
  if(!data.apellidos.trim()) return 'Debe ingresar apellidos.';
  if(!data.direccion.trim()) return 'Debe ingresar dirección.';
  if(!data.ciudad) return 'Debe seleccionar ciudad.';
  if(!/^\+?[0-9\s\-]{7,20}$/.test(data.telefono)) return 'Teléfono inválido.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Email inválido.';
  if(!data.fecha_nacimiento) return 'Debe indicar fecha de nacimiento.';
  var hoy = new Date();
  var f = new Date(data.fecha_nacimiento);
  if(f > hoy) return 'Fecha de nacimiento no puede ser futura.';
  if(!data.estado_civil) return 'Debe seleccionar estado civil.';
  if(data.comentarios && data.comentarios.length>500) return 'Comentarios: máximo 500 caracteres.';
  return null;
}
document.getElementById('saveBtn').addEventListener('click', ()=>{
  var data = {
    rut: document.getElementById('rut').value.trim(),
    nombres: document.getElementById('nombres').value.trim(),
    apellidos: document.getElementById('apellidos').value.trim(),
    direccion: document.getElementById('direccion').value.trim(),
    ciudad: document.getElementById('ciudad').value,
    telefono: document.getElementById('telefono').value.trim(),
    email: document.getElementById('email').value.trim(),
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
    estado_civil: document.getElementById('estado_civil').value,
    comentarios: document.getElementById('comentarios').value.trim(),
    actualizado_en: new Date().toISOString()
  };
  var err = validateForm(data);
  if(err){ showMessage(err,'error'); return; }
  var key = normalizeRut(data.rut);
  var all = loadRecords();
  if(all[key]){
    if(!confirm('Ya existe un registro con ese RUT. ¿Desea sobrescribir?')){
      showMessage('Operación cancelada. No se sobrescribió el registro.','error');
      return;
    }
  }
  all[key] = data;
  saveRecords(all);
  showMessage('Registro guardado correctamente.');
  populateResults([]);
});
document.getElementById('clearBtn').addEventListener('click', ()=>{
  document.getElementById('fichaForm').reset();
  showMessage('Formulario limpiado.','success');
});
document.getElementById('closeBtn').addEventListener('click', ()=>{
  try{ window.close(); } catch(e){}
  alert('Si el navegador impide cerrar la pestaña, puede simplemente cerrarla manualmente.');
});
document.getElementById('searchBtn').addEventListener('click', ()=>{
  var q = document.getElementById('searchApellido').value.trim().toLowerCase();
  var all = loadRecords();
  if(!q){ populateResults(Object.values(all)); return; }
  var res = Object.values(all).filter(r => r.apellidos.toLowerCase().includes(q));
  populateResults(res);
});
function populateResults(list){
  var area = document.getElementById('resultsArea');
  if(!list || list.length===0){ area.innerHTML = '<div class="muted">Sin resultados.</div>'; return; }
  var html = '<table><thead><tr><th>RUT</th><th>Nombres</th><th>Apellidos</th><th>Ciudad</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr></thead><tbody>';
  list.forEach(r=>{
    html += '<tr>'+
      '<td>'+escapeHtml(r.rut)+'</td>'+
      '<td>'+escapeHtml(r.nombres)+'</td>'+
      '<td>'+escapeHtml(r.apellidos)+'</td>'+
      '<td>'+escapeHtml(r.ciudad)+'</td>'+
      '<td>'+escapeHtml(r.telefono)+'</td>'+
      '<td>'+escapeHtml(r.email)+'</td>'+
      '<td><button class="small" onclick="loadRecord(\''+encodeURIComponent(normalizeRut(r.rut))+'\')">Cargar</button> <button class="small" onclick="deleteRecord(\''+encodeURIComponent(normalizeRut(r.rut))+'\')">Eliminar</button></td>'+
    '</tr>';
  });
  html += '</tbody></table>';
  area.innerHTML = html;
}
function escapeHtml(s){ return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
window.loadRecord = function(keyEncoded){
  var key = decodeURIComponent(keyEncoded);
  var all = loadRecords();
  var r = all[key];
  if(!r){ showMessage('Registro no encontrado.','error'); return; }
  document.getElementById('rut').value = r.rut;
  document.getElementById('nombres').value = r.nombres;
  document.getElementById('apellidos').value = r.apellidos;
  document.getElementById('direccion').value = r.direccion;
  document.getElementById('ciudad').value = r.ciudad;
  document.getElementById('telefono').value = r.telefono;
  document.getElementById('email').value = r.email;
  document.getElementById('fecha_nacimiento').value = r.fecha_nacimiento;
  document.getElementById('estado_civil').value = r.estado_civil;
  document.getElementById('comentarios').value = r.comentarios || '';
  showMessage('Registro cargado en formulario.');
  window.scrollTo({top:0,behavior:'smooth'});
}
window.deleteRecord = function(keyEncoded){
  var key = decodeURIComponent(keyEncoded);
  var all = loadRecords();
  var r = all[key];
  if(!r) { showMessage('Registro no existe.','error'); return; }
  if(!confirm('¿Eliminar definitivamente el registro de '+r.nombres+' '+r.apellidos+' (RUT '+r.rut+')?')) return;
  delete all[key];
  saveRecords(all);
  populateResults(Object.values(all));
  showMessage('Registro eliminado.');
}
document.getElementById('exportBtn').addEventListener('click', ()=>{
  var all = loadRecords();
  var blob = new Blob([JSON.stringify(all, null, 2)], {type:'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'ficha_medica_registros.json'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});
document.getElementById('importFile').addEventListener('change', (e)=>{
  var f = e.target.files[0]; if(!f) return;
  var reader = new FileReader();
  reader.onload = function(){
    try{
      var data = JSON.parse(reader.result);
      if(typeof data !== 'object') throw new Error('Formato inválido');
      saveRecords(data);
      showMessage('Importación realizada correctamente.');
      populateResults(Object.values(data));
    }catch(err){ showMessage('Error al importar: formato JSON inválido.','error'); }
  }
  reader.readAsText(f);
});
document.getElementById('injectDemo').addEventListener('click', ()=>{
  var demo = {
    '12345678K':{rut:'12.345.678-K',nombres:'María',apellidos:'González',direccion:'Calle Falsa 123',ciudad:'Santiago',telefono:'+56 9 8123 4567',email:'maria@example.com',fecha_nacimiento:'1990-05-12',estado_civil:'Soltero/a',comentarios:'Ninguna',actualizado_en:new Date().toISOString()},
    '98765432-1':{rut:'98.765.432-1',nombres:'Juan',apellidos:'Pérez',direccion:'Av. Central 45',ciudad:'Valparaíso',telefono:'+56 9 9123 4512',email:'juan.perez@example.com',fecha_nacimiento:'1985-10-02',estado_civil:'Casado/a',comentarios:'Alergia a penicilina',actualizado_en:new Date().toISOString()}
  };
  saveRecords(demo);
  populateResults(Object.values(demo));
  showMessage('Datos demo cargados.');
});
populateResults(Object.values(loadRecords()));
