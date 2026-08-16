/**
 * Local Workshop launch carousel contract.
 *
 * Rotation loops by default. Only the reader's explicit pause state can keep
 * it stopped after temporary hover, focus, or reduced-motion conditions end.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(path.join(__dirname, '..', 'static', 'js', 'slate-carousel.js'), 'utf8');

assert(script.includes('let pausedManually = false;'), 'Carousel should track an explicit manual pause state');
assert(script.includes('(currentIndex + direction + slides.length) % slides.length'), 'Carousel movement should wrap at both ends');
assert(script.includes('!pausedManually && !reducedMotion.matches'), 'Carousel should rotate unless manually paused or reduced motion is active');
assert(script.includes("carousel.addEventListener('mouseleave', startRotation)"), 'Carousel should resume after hover ends');
assert(script.includes("carousel.addEventListener('focusout'"), 'Carousel should resume after focus leaves');
assert(!script.includes('pausedManually = reducedMotion.matches'), 'Reduced-motion changes should not masquerade as a manual pause');

console.log('✅ Workshop launch carousel contract passed!');
