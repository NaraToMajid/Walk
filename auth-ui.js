/* auth-ui.js · Walk v1.6 · tombol mata untuk melihat/menyembunyikan sandi di form Masuk & Daftar */
(()=>{const f=document.getElementById('af');if(!f)return;
 const ic=n=>'<i data-lucide="'+n+'"></i>',draw=()=>window.lucide&&lucide.createIcons();
 for(const id of['ap1','ap2']){const i=document.getElementById(id);if(!i||i.parentNode.classList.contains('pw'))continue;
  const w=document.createElement('span'),b=document.createElement('button');w.className='pw';i.before(w);w.appendChild(i);
  b.type='button';b.className='pwb';b.setAttribute('aria-label','Lihat sandi');b.innerHTML=ic('eye');w.appendChild(b);
  b.onclick=()=>{const show=i.type==='password';i.type=show?'text':'password';b.innerHTML=ic(show?'eye-off':'eye');b.setAttribute('aria-label',show?'Sembunyikan sandi':'Lihat sandi');draw()}}
 const hide=()=>f.querySelectorAll('.pw input').forEach(i=>{i.type='password'});
 f.addEventListener('submit',hide);document.getElementById('aback').addEventListener('click',hide);draw()})();
