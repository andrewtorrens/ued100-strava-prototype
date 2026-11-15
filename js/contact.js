/* ==========================================================================
   contact.js — contact/support form (contact.html)
   Client-side validation with accessible error messages, then a success
   state. Prototype only: nothing is sent.

   Accessibility: each error is written into the field's own <p> (linked by
   aria-describedby), the field gets aria-invalid, and focus moves to the
   first problem. Errors clear as the user fixes them.

   Security (A1 spec): validation here is for user experience only. In
   production the server must validate and sanitise everything again, and
   all user input is displayed with textContent, never innerHTML.
   ========================================================================== */
(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const success = document.getElementById('contact-success');
  if (!form) return;

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MESSAGE_MIN = 20;
  const MESSAGE_MAX = 1000;

  /* Each rule returns an error message, or '' if the value is fine. */
  const rules = {
    name(value) {
      if (!value) return 'Enter your name.';
      return '';
    },
    email(value) {
      if (!value) return 'Enter your email address.';
      if (!EMAIL_PATTERN.test(value)) return 'Enter an email address like name@example.com.';
      return '';
    },
    topic(value) {
      if (!value) return 'Choose a topic.';
      return '';
    },
    message(value) {
      if (!value) return 'Enter a message.';
      if (value.length < MESSAGE_MIN) {
        return `Your message needs at least ${MESSAGE_MIN} characters (${value.length} so far).`;
      }
      if (value.length > MESSAGE_MAX) return `Keep your message under ${MESSAGE_MAX} characters.`;
      return '';
    },
  };

  const fields = Object.keys(rules).map((id) => document.getElementById(id));
  let submitted = false; // only validate as you type after the first submit attempt

  /** Validate one field, show or clear its error, return true if valid. */
  function validate(field) {
    const message = rules[field.id](field.value.trim()); // trim: whitespace-only counts as empty
    const errorEl = document.getElementById(`${field.id}-error`);
    errorEl.textContent = message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !message;
  }

  // Live re-checking after the first submit, so errors disappear as they're fixed
  fields.forEach((field) => {
    const event = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(event, () => { if (submitted) validate(field); });
  });

  // Character count in the message hint
  const message = document.getElementById('message');
  const hint = document.getElementById('message-hint');
  message.addEventListener('input', () => {
    const n = message.value.trim().length;
    hint.textContent = n < MESSAGE_MIN
      ? `At least ${MESSAGE_MIN} characters (${n} so far).`
      : `${n} / ${MESSAGE_MAX} characters.`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // prototype: nothing is sent anywhere
    submitted = true;

    const invalid = fields.filter((field) => !validate(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    // Success: replace the form with a confirmation (textContent only)
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    success.replaceChildren();

    const heading = document.createElement('h2');
    heading.textContent = 'Message sent';
    const text = document.createElement('p');
    text.textContent = `Thanks, ${name}. We'll reply to ${email} within two business days.`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'btn';
    again.textContent = 'Send another message';
    again.addEventListener('click', () => {
      form.reset();
      submitted = false;
      hint.textContent = `At least ${MESSAGE_MIN} characters.`;
      success.hidden = true;
      form.hidden = false;
      document.getElementById('name').focus();
    });

    success.append(heading, text, again);
    form.hidden = true;
    success.hidden = false;
    success.setAttribute('tabindex', '-1');
    success.focus(); // move focus so keyboard/screen reader users land on the result
  });
})();
