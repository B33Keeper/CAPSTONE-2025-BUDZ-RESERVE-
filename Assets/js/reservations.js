// rr- namespace JS for reservations modal
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function openModal(which){
    const el = document.getElementById('rrModal');
    if(!el) return;
    // eslint-disable-next-line no-undef
    const m = new bootstrap.Modal(el);
    // switch panel based on trigger; NAV stays visible, only one table shown
    const tabs = el.querySelectorAll('.rr-tab');
    const currentTab = el.querySelector('.rr-tab[data-panel="current"]');
    const historyTab = el.querySelector('.rr-tab[data-panel="history"]');
    const currentPanel = el.querySelector('#rr-current');
    const historyPanel = el.querySelector('#rr-history');
    tabs.forEach(b=>b.classList.remove('rr-tab--active'));
    [currentPanel, historyPanel].forEach(p=>p.classList.remove('rr-panel--active'));
    if(which === 'history'){
      historyTab.classList.add('rr-tab--active');
      historyPanel.classList.add('rr-panel--active');
    } else {
      currentTab.classList.add('rr-tab--active');
      currentPanel.classList.add('rr-panel--active');
    }
    // Ensure sidebar remains; we only toggle which table is rendered
    el.querySelector('.modal-content').classList.remove('rr-onepanel');
    m.show();
  }

  function bindTabs(modalEl){
    const tabs = $$('.rr-tab', modalEl);
    const panels = $$('.rr-panel', modalEl);
    tabs.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        tabs.forEach(b=>b.classList.remove('rr-tab--active'));
        panels.forEach(p=>p.classList.remove('rr-panel--active'));
        btn.classList.add('rr-tab--active');
        const target = btn.getAttribute('data-panel');
        const panel = target === 'history' ? $('#rr-history', modalEl) : $('#rr-current', modalEl);
        if(panel){ panel.classList.add('rr-panel--active'); }
      });
    });

    // Delete handler for history table
    const historyTable = $('#rr-history', modalEl);
    if(historyTable){
      historyTable.addEventListener('click', async (e)=>{
        const del = e.target.closest('.rr-delete');
        if(!del) return;
        const row = del.closest('tr');
        const id = row ? row.getAttribute('data-reservation-id') : null;
        if(!id) return;
        if(!confirm('Delete this reservation?')) return;
        try{
          const form = new FormData();
          form.append('reservation_id', id);
          const res = await fetch('delete_reservation.php', { method: 'POST', body: form, credentials: 'same-origin' });
          const data = await res.json();
          if(!res.ok || !data.ok){ throw new Error(data.message || 'Failed to delete'); }
          row.remove();
        }catch(err){
          const modal = document.getElementById('appFeedbackModal');
          if(modal){
            modal.querySelector('#appFeedbackBody').textContent = err.message;
            // eslint-disable-next-line no-undef
            new bootstrap.Modal(modal).show();
          } else {
            alert(err.message);
          }
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const trigger = document.querySelector('.js-resv-open');
    if(trigger){ trigger.addEventListener('click', (e)=>{ e.preventDefault(); openModal('current'); }); }
    const historyTrigger = document.querySelector('.js-history-open');
    if(historyTrigger){ historyTrigger.addEventListener('click', (e)=>{ e.preventDefault(); openModal('history'); }); }
    const modalEl = document.getElementById('rrModal');
    if(modalEl){ bindTabs(modalEl); }
  });
})();


