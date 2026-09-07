const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');

const SCROLL_ON = 24;
const SCROLL_OFF = 8;

const updateHeaderState = () => {
  if (!siteHeader) return;
  if (window.scrollY > SCROLL_ON) {
    siteHeader.classList.add('is-scrolled');
  } else if (window.scrollY < SCROLL_OFF) {
    siteHeader.classList.remove('is-scrolled');
  }
  // Between SCROLL_OFF and SCROLL_ON: leave state as-is (dead zone, prevents flicker)
};

updateHeaderState();
window.addEventListener('scroll', updateHeaderState, { passive: true });
window.addEventListener('load', updateHeaderState);

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

const getEventMeta = (document, name) => document.querySelector(`meta[name="event:${name}"]`)?.content || '';
const getInitiativeMeta = (document, name) => document.querySelector(`meta[name="initiative:${name}"]`)?.content || '';

const parseYamlList = (yaml) => yaml
  .split('\n')
  .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1].trim())
  .filter(Boolean);

const createEventCard = (url, eventDocument, isFirst) => {
  const card = document.createElement('article');
  card.className = 'event-card';
  card.innerHTML =
    `<a class="event-card-image" href="${url}">
      <img src="images/${getEventMeta(eventDocument, 'image')}" alt="${getEventMeta(eventDocument, 'image-alt')}" loading="lazy">
      ${isFirst ? '<span class="event-card-status">Prossimamente</span>' : ''}
    </a>
    <div class="event-card-body">
      <p class="event-date">
        <strong>${getEventMeta(eventDocument, 'date')}</strong>
        <span>${getEventMeta(eventDocument, 'date-label')}</span>
      </p>
      <h3>${getEventMeta(eventDocument, 'title')}</h3>
      <p>${getEventMeta(eventDocument, 'summary')}</p>
      <dl class="event-details">
        <div>
          <dt>Dove</dt>
          <dd>${getEventMeta(eventDocument, 'location')}</dd>
        </div>
        <div>
          <dt>Quando</dt>
          <dd>${getEventMeta(eventDocument, 'time')}</dd>
        </div>
      </dl>
      <a class="text-link" href="${url}">Scopri l'evento <span aria-hidden="true">→</span></a>
    </div>`;
  return card;
};

const createInitiativeCard = (url, initiativeDocument) => {
  const card = document.createElement('article');
  card.className = 'event-card initiative-card';
  card.innerHTML =
    `<a class="event-card-image" href="${url}">
      <img src="images/${getInitiativeMeta(initiativeDocument, 'image')}" alt="${getInitiativeMeta(initiativeDocument, 'image-alt')}" loading="lazy">
      <span class="event-card-status">${getInitiativeMeta(initiativeDocument, 'status')}</span>
    </a>
    <div class="event-card-body">
      <p class="event-date">
        <strong>${getInitiativeMeta(initiativeDocument, 'date')}</strong>
        <span>${getInitiativeMeta(initiativeDocument, 'date-label')}</span>
      </p>
      <h3>${getInitiativeMeta(initiativeDocument, 'title')}</h3>
      <p>${getInitiativeMeta(initiativeDocument, 'summary')}</p>
      <dl class="event-details">
        <div>
          <dt>Dove</dt>
          <dd>${getInitiativeMeta(initiativeDocument, 'location')}</dd>
        </div>
        <div>
          <dt>Quando</dt>
          <dd>${getInitiativeMeta(initiativeDocument, 'time')}</dd>
        </div>
      </dl>
      <a class="text-link" href="${url}">
        Scopri l'iniziativa <span aria-hidden="true">→</span>
      </a>
    </div>`;
  return card;
};

if (eventGrid) {
  fetch('eventi/eventi.yaml')
    .then((response) => {
      if (!response.ok) throw new Error('Unable to load the upcoming event list');
      return response.text();
    })
    .then(parseYamlList)
    .then((upcomingEvents) => Promise.all(upcomingEvents.map(async (url) => [url, await readEventPage(url)])))
    .then((events) => {
      events.forEach(([url, eventDocument], index) => eventGrid.append(createEventCard(url, eventDocument, index === 0)));
      const announcement = document.createElement('article');
      announcement.className = 'event-card event-card-highlight';
      announcement.innerHTML = '<div class="event-card-body"><p class="event-kicker">Non perderti i prossimi eventi</p><h3>Il calendario si riempie di nuove storie.</h3><p>Seguici per scoprire i prossimi appuntamenti e non perdere l\'annuncio.</p><a class="button" href="news.html">Seguici sui social <span aria-hidden="true">→</span></a></div>';
      eventGrid.append(announcement);
    })
    .catch(() => {
      eventGrid.innerHTML = '<div class="event-load-error"><strong>Gli eventi non si sono caricati.</strong><span>Apri il sito tramite GitHub Pages o un server locale per visualizzare le schede.</span></div>';
    });
}

const initiativeGrid = document.querySelector('[data-initiatives]');

if (initiativeGrid) {
  fetch('iniziative/iniziative.yml')
    .then((response) => {
      if (!response.ok) throw new Error('Unable to load the initiative list');
      return response.text();
    })
    .then(parseYamlList)
    .then((initiatives) => Promise.all(initiatives.map(async (url) => [url, await readEventPage(url)])))
    .then((initiatives) => {
      initiatives.forEach(([url, initiativeDocument]) => initiativeGrid.append(createInitiativeCard(url, initiativeDocument)));
      const announcement = document.createElement('article');
      announcement.className = 'event-card event-card-highlight';
      announcement.innerHTML = '<div class="event-card-body"><p class="event-kicker">Stiamo preparando qualcosa</p><h3>Il calendario si riempie di nuove storie.</h3><p>Seguici per scoprire i prossimi appuntamenti e non perdere l\'annuncio.</p><a class="button" href="news.html">Tienimi aggiornato <span aria-hidden="true">→</span></a></div>';
      initiativeGrid.append(announcement);
    })
    .catch(() => {
      initiativeGrid.innerHTML = '<div class="event-load-error"><strong>Le iniziative non si sono caricate.</strong><span>Apri il sito tramite GitHub Pages o un server locale per visualizzare le schede.</span></div>';
    });
}