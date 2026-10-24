// The email address is assembled only on click, so it never appears in the
// page source as plain text and is harder for scrapers to harvest.
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-email]');
  if (!trigger) return;
  event.preventDefault();
  const address = ['tomaskovac00', 'gmail.com'].join('@');
  window.location.href = 'mailto:' + address;
});
