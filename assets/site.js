// The email address is assembled only on click, so it never appears in the
// page source as plain text and is harder for scrapers to harvest.
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-email]');
  if (!trigger) return;
  event.preventDefault();
  const address = ['tomaskovac00', 'gmail.com'].join('@');
  window.location.href = 'mailto:' + address;
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------
   Experience timeline. The axis runs from .tl[data-from] to the end of
   .tl[data-to] ("YYYY-MM"). Each .tl-bar is placed by data-start /
   data-end ("YYYY-MM" or "present"); every track gets year ticks and
   the "now" marker so the rows read as one chart.
   ------------------------------------------------------------------ */
const toMonths = (value, endOfMonth = false) => {
  if (value === 'present') {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth() + now.getDate() / 31;
  }
  const [y, m] = value.split('-').map(Number);
  return y * 12 + (m - 1) + (endOfMonth ? 1 : 0);
};

document.querySelectorAll('.tl').forEach((tl) => {
  const from = toMonths(tl.dataset.from);
  const to = toMonths(tl.dataset.to, true);
  const pct = (m) => Math.min(Math.max(((m - from) / (to - from)) * 100, 0), 100);
  const years = [];
  for (let y = Math.ceil(from / 12); y * 12 < to; y++) years.push(y);
  const nowPct = pct(toMonths('present'));

  const axis = tl.querySelector('.tl-axis');
  if (axis) {
    axis.innerHTML = years
      .map((y, i) => `<span class="${i % 2 ? 'odd' : ''}" style="left:${pct(y * 12)}%">${y}</span>`)
      .join('') + `<span class="now" style="left:${nowPct}%">now</span>`;
  }

  tl.querySelectorAll('.tl-track').forEach((track) => {
    track.insertAdjacentHTML(
      'afterbegin',
      years.map((y) => `<i class="tick" style="left:${pct(y * 12)}%"></i>`).join('') +
        `<i class="now" style="left:${nowPct}%"></i>`
    );
    track.querySelectorAll('.tl-bar').forEach((bar) => {
      const left = pct(toMonths(bar.dataset.start));
      const right = pct(toMonths(bar.dataset.end, true));
      bar.style.left = left + '%';
      bar.style.width = Math.max(right - left, 0.8) + '%';
    });
  });
});

/* ------------------------------------------------------------------
   Windows: [data-open="id"] opens <dialog id="id">, growing out of the
   clicked logo. Closes on the close button, the backdrop or Esc.
   ------------------------------------------------------------------ */
const ENTER_MS = 320;
const EXIT_MS = 200;
let lastTrigger = null;

const originOf = (trigger) =>
  (trigger.querySelector('.logo') || trigger).getBoundingClientRect();

const flipFrom = (dialog, rect) => {
  const box = dialog.getBoundingClientRect();
  const dx = rect.left + rect.width / 2 - (box.left + box.width / 2);
  const dy = rect.top + rect.height / 2 - (box.top + box.height / 2);
  const sx = Math.max(rect.width / box.width, 0.05);
  const sy = Math.max(rect.height / box.height, 0.05);
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
};

const animateBackdrop = (dialog, frames, options) => {
  try { dialog.animate(frames, { ...options, pseudoElement: '::backdrop' }); } catch (_) { /* unsupported */ }
};

function openWindow(dialog, trigger) {
  lastTrigger = trigger;
  dialog.showModal();
  const body = dialog.querySelector('.win-body');
  if (body) body.scrollTop = 0;

  if (reducedMotion.matches) {
    dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    return;
  }
  const from = flipFrom(dialog, originOf(trigger));
  dialog.animate(
    [{ transform: from, opacity: 0.2 }, { transform: 'none', opacity: 1 }],
    { duration: ENTER_MS, easing: 'cubic-bezier(.2,.8,.2,1)' }
  );
  dialog.querySelector('.win-inner')?.animate(
    [{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }],
    { duration: ENTER_MS, easing: 'ease-out' }
  );
  animateBackdrop(dialog, [{ opacity: 0 }, { opacity: 1 }], { duration: ENTER_MS });
}

function closeWindow(dialog) {
  if (!dialog.open || dialog.dataset.closing) return;
  dialog.dataset.closing = '1';
  const finish = () => {
    dialog.close();
    delete dialog.dataset.closing;
    lastTrigger?.focus({ preventScroll: true });
  };

  if (reducedMotion.matches || !lastTrigger) {
    dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120 }).onfinish = finish;
    return;
  }
  const to = flipFrom(dialog, originOf(lastTrigger));
  const anim = dialog.animate(
    [{ transform: 'none', opacity: 1 }, { transform: to, opacity: 0 }],
    { duration: EXIT_MS, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }
  );
  animateBackdrop(dialog, [{ opacity: 1 }, { opacity: 0 }], { duration: EXIT_MS, fill: 'forwards' });
  anim.onfinish = () => { finish(); anim.cancel(); };
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-open]');
  if (!trigger) return;
  const dialog = document.getElementById(trigger.dataset.open);
  if (dialog) openWindow(dialog, trigger);
});

document.querySelectorAll('dialog.win').forEach((dialog) => {
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeWindow(dialog); });
  dialog.addEventListener('click', (event) => {
    // A click on the dialog element itself (not its content) is the backdrop.
    if (event.target === dialog || event.target.closest('[data-close]')) closeWindow(dialog);
  });
});

// Deep link: cv.html#exp-kamstrup opens that window on load.
const linked = location.hash && document.getElementById(location.hash.slice(1));
if (linked && linked.matches('dialog.win')) {
  const trigger = document.querySelector(`[data-open="${linked.id}"]`);
  if (trigger) openWindow(linked, trigger);
}
