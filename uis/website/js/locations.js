import { getTranslationWithFallback } from './language/translation-utils.js';

// Filter the existing clinic elements without fetching another directory.
const regionFilters = document.querySelectorAll('[data-region-filter]');
const clinicCards = document.querySelectorAll('[data-region]');
const clinicStatus = document.getElementById('clinic-status');
let selectedRegion = 'all';
let visibleCount = clinicCards.length;

regionFilters.forEach((button) => {
  button.addEventListener('click', () => {
    const region = button.dataset.regionFilter;
    selectedRegion = region;
    visibleCount = 0;

    clinicCards.forEach((card) => {
      const visible = region === 'all' || card.dataset.region === region;
      card.hidden = !visible;
      // Explicitly override the card's Tailwind flex display when hidden.
      card.classList.toggle('hidden', !visible);
      card.classList.toggle('flex', visible);
      if (visible) visibleCount += 1;
    });

    regionFilters.forEach((filter) => {
      const selected = filter === button;
      filter.setAttribute('aria-pressed', String(selected));
      ['bg-[#032348]', 'text-white'].forEach((name) => filter.classList.toggle(name, selected));
      ['bg-[#eef3ff]', 'text-slate-600', 'hover:bg-blue-100'].forEach((name) => filter.classList.toggle(name, !selected));
    });

    updateClinicStatus();
  });
});

// Refresh the result announcement when filtering or changing language.
function updateClinicStatus() {
  const key = selectedRegion === 'all' ? 'all' : visibleCount === 1 ? 'one' : 'many';
  clinicStatus.textContent = getTranslationWithFallback(
    `locations.status.${key}`, document.documentElement.lang,
  ).replace('{count}', String(visibleCount)).replace('{region}', selectedRegion);
}

document.addEventListener('languagechange', updateClinicStatus);
updateClinicStatus();
