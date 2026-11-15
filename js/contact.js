/* ==========================================================================
   contact.js — contact/support form (contact.html)
   ========================================================================== */
(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const success = document.getElementById('contact-success');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // prototype: nothing is sent anywhere

    // TODO: validation + success state
  });
})();
