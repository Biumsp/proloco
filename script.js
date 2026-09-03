const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');

const updateHeaderState = () => {
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 80);
};

updateHeaderState();
window.addEventListener('scroll', updateHeaderState, { passive: true });
document.addEventListener('scroll', updateHeaderState, { passive: true });
window.addEventListener('load', updateHeaderState);

if (siteHeader && 'IntersectionObserver' in window) {
  const scrollSentinel = document.createElement('div');
  scrollSentinel.className = 'scroll-sentinel';
  scrollSentinel.setAttribute('aria-hidden', 'true');
  siteHeader.after(scrollSentinel);
  new IntersectionObserver(([entry]) => {
    siteHeader.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(scrollSentinel);
}

const watchHeaderState = () => {
  updateHeaderState();
  window.requestAnimationFrame(watchHeaderState);
};

window.requestAnimationFrame(watchHeaderState);

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const eventGrid = document.querySelector('[data-upcoming-events]');

const readEventPage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url}`);
  const html = await response.text();
  return new DOMParser().parseFromString(html, 'text/html');
};

const getMeta = (document, name) => document.querySelector(`meta[name="event:${name}"]`)?.content || '';

const parseEventList = (yaml) => yaml
  .split('\n')
  .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1].trim())
  .filter(Boolean);

const createEventCard = (url, eventDocument) => {
  const card = document.createElement('article');
  card.className = 'event-card';
  card.innerHTML = `<a class="event-card-image" href="${url}"><img src="${getMeta(eventDocument, 'image')}" alt="${getMeta(eventDocument, 'image-alt')}" loading="lazy"><span class="event-card-status">${getMeta(eventDocument, 'status')}</span></a><div class="event-card-body"><p class="event-date"><strong>${getMeta(eventDocument, 'date')}</strong><span>${getMeta(eventDocument, 'date-label')}</span></p><h3>${getMeta(eventDocument, 'title')}</h3><p>${getMeta(eventDocument, 'summary')}</p><dl class="event-details"><div><dt>Dove</dt><dd>${getMeta(eventDocument, 'location')}</dd></div><div><dt>Quando</dt><dd>${getMeta(eventDocument, 'time')}</dd></div></dl><a class="text-link" href="${url}">Scopri l'evento <span aria-hidden="true">→</span></a></div>`;
  return card;
};

if (eventGrid) {
  fetch('eventi/prossimi/events.yaml')
    .then((response) => {
      if (!response.ok) throw new Error('Unable to load the upcoming event list');
      return response.text();
    })
    .then(parseEventList)
    .then((upcomingEvents) => Promise.all(upcomingEvents.map(async (url) => [url, await readEventPage(url)])))
    .then((events) => {
      events.forEach(([url, eventDocument]) => eventGrid.append(createEventCard(url, eventDocument)));
      const announcement = document.createElement('article');
      announcement.className = 'event-card event-card-highlight';
      announcement.innerHTML = '<div class="event-card-body"><p class="event-kicker">Stiamo preparando qualcosa</p><h3>Il calendario si riempie di nuove storie.</h3><p>Seguici per scoprire i prossimi appuntamenti e non perdere l\'annuncio.</p><a class="button" href="news.html">Tienimi aggiornato <span aria-hidden="true">→</span></a></div>';
      eventGrid.append(announcement);
    })
    .catch(() => {
      eventGrid.innerHTML = '<div class="event-load-error"><strong>Gli eventi non si sono caricati.</strong><span>Apri il sito tramite GitHub Pages o un server locale per visualizzare le schede.</span></div>';
    });
}