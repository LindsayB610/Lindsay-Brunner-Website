(() => {
  const initialiseCarousel = (carousel) => {
    const track = carousel.querySelector('[data-slate-carousel-track]');
    const previous = carousel.querySelector('[data-slate-carousel-previous]');
    const next = carousel.querySelector('[data-slate-carousel-next]');
    const current = carousel.querySelector('[data-slate-carousel-current]');
    const pause = carousel.querySelector('[data-slate-carousel-pause]');
    const slides = track ? [...track.querySelectorAll('.slate-carousel__slide')] : [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rotationTimer;
    let pausedManually = false;

    if (!track || !previous || !next || !current || !pause || slides.length < 2) return;

    const updateControls = () => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      current.textContent = String(index + 1);
    };

    const move = (direction) => {
      const currentIndex = Math.round(track.scrollLeft / track.clientWidth);
      const nextIndex = (currentIndex + direction + slides.length) % slides.length;
      track.scrollTo({ left: nextIndex * track.clientWidth, behavior: 'smooth' });
    };

    const stopRotation = () => window.clearInterval(rotationTimer);
    const startRotation = () => {
      stopRotation();
      if (!pausedManually && !reducedMotion.matches) {
        rotationTimer = window.setInterval(() => move(1), 5000);
      }
    };

    const updatePauseControl = () => {
      pause.setAttribute('aria-pressed', String(pausedManually));
      pause.disabled = reducedMotion.matches;
      pause.textContent = reducedMotion.matches ? 'Rotation paused' : pausedManually ? 'Play rotation' : 'Pause rotation';
    };

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    pause.addEventListener('click', () => {
      pausedManually = !pausedManually;
      updatePauseControl();
      startRotation();
    });
    track.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls, { passive: true });
    carousel.addEventListener('mouseenter', stopRotation);
    carousel.addEventListener('mouseleave', startRotation);
    carousel.addEventListener('focusin', stopRotation);
    carousel.addEventListener('focusout', (event) => {
      if (!carousel.contains(event.relatedTarget)) startRotation();
    });
    reducedMotion.addEventListener('change', () => {
      updatePauseControl();
      startRotation();
    });
    updateControls();
    updatePauseControl();
    startRotation();
  };

  document.querySelectorAll('[data-slate-carousel]').forEach(initialiseCarousel);
})();
