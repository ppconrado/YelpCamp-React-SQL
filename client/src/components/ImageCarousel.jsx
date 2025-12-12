import React, { useEffect, useState } from 'react';
import Carousel from 'bootstrap/js/dist/carousel';

const ImageCarousel = ({
  images = [],
  id = 'campCarousel',
  altPrefix = 'Imagem',
  captionTitle,
  captionSubtitle,
}) => {
  const carouselId = id;
  const [activeIdx, setActiveIdx] = useState(0);

  // Sync active thumbnail with Bootstrap carousel events
  useEffect(() => {
    const el = document.getElementById(carouselId);
    if (!el) return;

    // Ensure instance exists so keyboard/controls work
    Carousel.getOrCreateInstance(el);

    const onSlid = (e) => {
      // Bootstrap provides e.to with the new active index
      if (typeof e.to === 'number') {
        setActiveIdx(e.to);
      } else {
        // Fallback: derive from DOM active item index
        const items = Array.from(el.querySelectorAll('.carousel-item'));
        const current = items.findIndex((n) => n.classList.contains('active'));
        if (current >= 0) setActiveIdx(current);
      }
    };

    el.addEventListener('slid.bs.carousel', onSlid);

    return () => {
      el.removeEventListener('slid.bs.carousel', onSlid);
      // Do not dispose; parent page may reuse carousel via routing; keeping instance is fine
      // If needed in the future: instance.dispose();
    };
  }, [carouselId]);

  // Reset active index if image set changes
  useEffect(() => {
    setActiveIdx(0);
  }, [carouselId, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <div
        id={carouselId}
        className={`carousel slide ${images.length > 1 ? 'has-thumbs' : ''}`}
        data-bs-ride="carousel"
      >
        {images.length > 1 && (
          <div className="carousel-indicators">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                data-bs-target={`#${carouselId}`}
                data-bs-slide-to={idx}
                className={idx === 0 ? 'active' : ''}
                aria-current={idx === 0 ? 'true' : undefined}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <div className="carousel-inner">
          {images.map((img, idx) => (
            <div
              key={img.filename || img.url || idx}
              className={`carousel-item ${idx === 0 ? 'active' : ''}`}
            >
              <img
                src={img.url}
                className="d-block w-100 carousel-main-img"
                alt={`${altPrefix} - ${img.filename || `Slide ${idx + 1}`}`}
                loading="lazy"
              />
              {/* Gradient overlay to improve caption readability */}
              <div className="carousel-gradient-overlay" />
              {(captionTitle || captionSubtitle) && (
                <div className="carousel-caption">
                  <div className="d-inline-block bg-dark bg-opacity-50 rounded-2 px-2 py-1">
                    {captionTitle && (
                      <h5 className="mb-1 text-white">{captionTitle}</h5>
                    )}
                    {captionSubtitle && (
                      <p className="mb-0 small text-white">{captionSubtitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target={`#${carouselId}`}
              data-bs-slide="prev"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target={`#${carouselId}`}
              data-bs-slide="next"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Next</span>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails fora do container do carousel para evitar sobreposição dos indicadores */}
      {images.length > 1 && (
        <div className="mt-2 carousel-thumbs">
          <div className="row row-cols-auto g-2 justify-content-center">
            {images.map((img, idx) => (
              <div key={`thumb-${img.filename || idx}`} className="col">
                <button
                  type="button"
                  className={`btn p-0 border-0 ${
                    idx === activeIdx
                      ? 'opacity-100 border border-primary'
                      : 'opacity-75'
                  }`}
                  onClick={() => {
                    const el = document.getElementById(carouselId);
                    if (!el) return;
                    const instance = Carousel.getOrCreateInstance(el);
                    instance.to(idx);
                    setActiveIdx(idx);
                  }}
                  aria-current={idx === activeIdx ? 'true' : undefined}
                  aria-label={`Ir para imagem ${idx + 1}`}
                >
                  <img
                    src={img.url}
                    alt={`${altPrefix} - miniatura ${idx + 1}`}
                    loading="lazy"
                    className="carousel-thumb-img"
                    style={{ width: 72, height: 48, objectFit: 'cover' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCarousel;
