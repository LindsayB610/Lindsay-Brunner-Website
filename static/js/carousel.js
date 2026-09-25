(() => {
  const initialiseCarousel = (carousel) => {
    if (carousel.dataset.carouselReady === 'true') return;

    const track = carousel.querySelector('[data-carousel-track]');
    const previous = carousel.querySelector('[data-carousel-previous]');
    const next = carousel.querySelector('[data-carousel-next]');
    const current = carousel.querySelector('[data-carousel-current]');
    const captionPhase = carousel.querySelector('[data-carousel-caption-phase]');
    const caption = carousel.querySelector('[data-carousel-caption]');
    const pause = carousel.querySelector('[data-carousel-pause]');
    const slides = track ? [...track.querySelectorAll('[data-carousel-slide]')] : [];
    const centered = track?.dataset.carouselAlign === 'center';
    const loops = carousel.dataset.carouselLoop === 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rotationTimer;
    let pausedManually = false;

    if (!track || !previous || !next || slides.length < 2) return;

    carousel.dataset.carouselReady = 'true';

    const getSlideStart = (slide) => {
      const trackRect = track.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();
      return slideRect.left - trackRect.left - track.clientLeft + track.scrollLeft;
    };

    const getSlideCenter = (slide) => getSlideStart(slide) + slide.getBoundingClientRect().width / 2;

    const getIndex = () => {
      if (!track.clientWidth) return 0;

      const snapInset = Number.parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      const target = centered ? track.scrollLeft + track.clientWidth / 2 : track.scrollLeft + snapInset;
      const positions = slides.map((slide) => centered ? getSlideCenter(slide) : getSlideStart(slide));

      return positions.reduce((closestIndex, position, index) => (
        Math.abs(position - target) < Math.abs(positions[closestIndex] - target) ? index : closestIndex
      ), 0);
    };

    const updateControls = () => {
      const index = getIndex();
      if (current) current.textContent = String(index + 1);
      if (captionPhase) captionPhase.textContent = slides[index].dataset.slidePhase || '';
      if (caption) caption.textContent = slides[index].dataset.slideCaption || '';
      previous.disabled = !loops && index === 0;
      next.disabled = !loops && index === slides.length - 1;
      slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === index));
    };

    const showSlide = (index, behavior = 'smooth') => {
      const boundedIndex = loops
        ? (index + slides.length) % slides.length
        : Math.max(0, Math.min(slides.length - 1, index));
      const snapInset = Number.parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      const target = centered
        ? getSlideCenter(slides[boundedIndex]) - track.clientWidth / 2
        : getSlideStart(slides[boundedIndex]) - snapInset;

      track.scrollTo({
        left: target,
        behavior: reducedMotion.matches ? 'auto' : behavior,
      });
    };

    const stopRotation = () => window.clearInterval(rotationTimer);
    const startRotation = () => {
      stopRotation();
      if (pause && !pausedManually && !reducedMotion.matches) {
        rotationTimer = window.setInterval(() => showSlide(getIndex() + 1), 5000);
      }
    };

    previous.addEventListener('click', () => showSlide(getIndex() - 1));
    next.addEventListener('click', () => showSlide(getIndex() + 1));
    track.addEventListener('scroll', updateControls, { passive: true });
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showSlide(getIndex() - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showSlide(getIndex() + 1);
      }
    });
    window.addEventListener('resize', () => showSlide(getIndex(), 'auto'), { passive: true });

    if (pause) {
      const updatePauseControl = () => {
        pause.setAttribute('aria-pressed', String(pausedManually));
        pause.disabled = reducedMotion.matches;
        pause.textContent = reducedMotion.matches ? 'Rotation paused' : pausedManually ? 'Play rotation' : 'Pause rotation';
      };

      pause.addEventListener('click', () => {
        pausedManually = !pausedManually;
        updatePauseControl();
        startRotation();
      });
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
      updatePauseControl();
      startRotation();
    }

    updateControls();
  };

  document.querySelectorAll('[data-carousel]').forEach(initialiseCarousel);
})();
