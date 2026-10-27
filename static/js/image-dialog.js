// Shared interaction boundary: never attach an original until a user opens it.
(() => {
  function clearImage(image) {
    const picture = image.closest("picture");
    if (picture) picture.querySelectorAll("source").forEach((source) => source.remove());
    for (const attribute of ["src", "srcset", "sizes", "width", "height", "loading", "fetchpriority", "data-image-source", "data-image-profile"])
      image.removeAttribute(attribute);
  }
  function openOriginal(image, source) {
    const url = new URL(source, document.baseURI);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) throw new Error("Original image must be local");
    clearImage(image);
    image.src = url.href;
  }
  window.ImageDelivery = Object.freeze({ clearImage, openOriginal });
})();
