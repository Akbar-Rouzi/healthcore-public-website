// Keep every clinic in the HTML so the directory also works without JavaScript.
const regionFilters = document.querySelectorAll('[data-region-filter]');
const clinicCards = document.querySelectorAll('[data-region]');
const clinicStatus = document.getElementById('clinic-status');

regionFilters.forEach((button) => {
  button.addEventListener('click', () => {
    const region = button.dataset.regionFilter;
    let visibleCount = 0;

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

    clinicStatus.textContent = region === 'all'
      ? `Showing all ${visibleCount} clinics.`
      : `Showing ${visibleCount} ${visibleCount === 1 ? 'clinic' : 'clinics'} in ${region}.`;
  });
});
