// Namespaced user profile modal interactions (Bootstrap + up- namespace)
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  function showModal(message){
    const modalEl = document.getElementById('appFeedbackModal');
    if(!modalEl) { alert(message); return; }
    $('#appFeedbackBody', modalEl).textContent = message;
    // eslint-disable-next-line no-undef
    const m = new bootstrap.Modal(modalEl);
    m.show();
  }

  const openBtn = document.querySelector('.js-up-open');
  const modalEl = document.getElementById('upModal');
  const navBtns = modalEl ? $$('.up-nav-btn', modalEl) : [];
  const managePanel = modalEl ? $('.up-panel-manage', modalEl) : null;
  const passwordPanel = modalEl ? $('.up-panel-password', modalEl) : null;
  let bsModal = null;

  function ensureModal(){
    if(!modalEl) return null;
    if(!bsModal){
      // eslint-disable-next-line no-undef
      bsModal = new bootstrap.Modal(modalEl, { backdrop: true });
    }
    return bsModal;
  }

  function open(){ const m = ensureModal(); if(m){ m.show(); } }

  function switchPanel(target){
    if(!modalEl) return;
    [managePanel, passwordPanel].forEach(p=>p && p.classList.remove('up-panel--active'));
    navBtns.forEach(b=>b.classList.remove('up-nav-btn--active'));
    if(target === 'password'){
      passwordPanel && passwordPanel.classList.add('up-panel--active');
      modalEl.querySelector('.up-nav-password').classList.add('up-nav-btn--active');
    } else {
      managePanel && managePanel.classList.add('up-panel--active');
      modalEl.querySelector('.up-nav-manage').classList.add('up-nav-btn--active');
    }
  }

  function initEyes(){
    if(!modalEl) return;
    $$('.up-eye', modalEl).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-target');
        const input = document.getElementById(id);
        if(!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });
  }

  function initForms(){
    if(!modalEl) return;
    const manageForm = $('#up-manage-form', modalEl);
    const passwordForm = $('#up-password-form', modalEl);
    if(manageForm){
      manageForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        // TODO: hook to backend endpoint to update username/email
      });
    }
    if(passwordForm){
      passwordForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const currentP = $('#up-current', modalEl).value.trim();
        const newP = $('#up-new', modalEl).value.trim();
        const confirmP = $('#up-confirm', modalEl).value.trim();
        if(newP.length < 8){ showModal('New password must be at least 8 characters.'); return; }
        if(newP !== confirmP){ showModal('Passwords do not match.'); return; }
        try{
          const formData = new FormData();
          formData.append('current_password', currentP);
          formData.append('new_password', newP);
          formData.append('confirm_password', confirmP);
          const res = await fetch('update_password.php', { method: 'POST', body: formData, credentials: 'same-origin' });
          const data = await res.json();
          if(!res.ok || !data.ok){ throw new Error(data.message || 'Failed to update password'); }
          showModal('Password updated successfully');
          // Reset inputs
          $('#up-current', modalEl).value = '';
          $('#up-new', modalEl).value = '';
          $('#up-confirm', modalEl).value = '';
        }catch(err){
          showModal(err.message);
        }
      });
    }
  }

  function bind(){
    if(openBtn){ openBtn.addEventListener('click', (e)=>{ e.preventDefault(); open(); }); }
    if(modalEl){
      navBtns.forEach(btn=>{
        btn.addEventListener('click', ()=> switchPanel(btn.getAttribute('data-panel')));
      });

      const photoTrigger = modalEl.querySelector('#up-photo-trigger');
      const photoInput = modalEl.querySelector('#up-photo-input');
      const photoForm = modalEl.querySelector('#up-photo-form');
      const avatarImg = modalEl.querySelector('.up-avatar-img');
      if(photoTrigger && photoInput && avatarImg){
        photoTrigger.addEventListener('click', ()=> photoInput.click());
        photoInput.addEventListener('change', async ()=>{
          if(!photoInput.files || !photoInput.files[0]) return;
          const form = photoForm ? new FormData(photoForm) : (()=>{ const fd=new FormData(); fd.append('avatar', photoInput.files[0]); return fd; })();
          try{
            const res = await fetch('upload_avatar.php', { method: 'POST', body: form, credentials: 'same-origin' });
            const text = await res.text();
            let data = {};
            try { data = JSON.parse(text); } catch(e) { throw new Error('Upload failed: invalid server response'); }
            if(!res.ok || !data.ok){ throw new Error(data.message || 'Upload failed'); }
            avatarImg.src = data.avatar;
            // Also update navbar profile pic if present
            const headerPic = document.querySelector('.profile-pic');
            if(headerPic){ headerPic.src = data.avatar; }
            showModal('Profile picture updated successfully');
          }catch(err){
            showModal(err.message);
          }finally{
            photoInput.value = '';
          }
        });
      }
    }
    initEyes();
    initForms();
  }

  document.addEventListener('DOMContentLoaded', bind);
})();


