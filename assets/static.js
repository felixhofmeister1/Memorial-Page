// The few things the app does in the browser, for the static GitHub Pages copy.
(function () {
  var lang = document.documentElement.lang || 'en';
  var sent = {
    en: 'This is a preview. Nothing was sent.',
    de: 'Dies ist eine Vorschau. Es wurde nichts gesendet.',
    es: 'Esta es una vista previa. No se envió nada.',
  }[lang] || 'This is a preview. Nothing was sent.';

  // Menu: the mobile panel and the drop-downs
  function setOpen(button, open) {
    var target = document.getElementById(button.getAttribute('aria-controls'));
    if (!target) return;
    if (target.classList.contains('hidden') || target.classList.contains('block')) {
      target.classList.toggle('hidden', !open);
      target.classList.toggle('block', open);
    } else {
      target.hidden = !open;
    }
    button.setAttribute('aria-expanded', String(open));
    var caret = button.querySelector('svg');
    if (caret) caret.classList.toggle('rotate-180', open);
  }
  var buttons = Array.prototype.slice.call(document.querySelectorAll('nav button[aria-controls]'));
  var dropdowns = buttons.filter(function (b) { return b.closest('li'); });
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') !== 'true';
      if (button.closest('li')) dropdowns.forEach(function (other) { if (other !== button) setOpen(other, false); });
      setOpen(button, open);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') dropdowns.forEach(function (b) { setOpen(b, false); });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('nav')) dropdowns.forEach(function (b) { setOpen(b, false); });
  });

  // Search on the overview: filter the list by name
  function plain(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  document.querySelectorAll('form[role="search"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var q = plain(input ? input.value : '');
      document.querySelectorAll('main li').forEach(function (li) {
        var name = li.querySelector('a span.font-serif');
        if (name) li.hidden = q !== '' && plain(name.textContent).indexOf(q) === -1;
      });
    });
  });

  // Other forms: nothing can be sent from here
  document.querySelectorAll('form:not([role="search"])').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.static-note');
      if (!note) {
        note = document.createElement('p');
        note.className = 'static-note mt-4 font-semibold';
        note.setAttribute('role', 'status');
        form.appendChild(note);
      }
      note.textContent = sent;
    });
  });
})();
