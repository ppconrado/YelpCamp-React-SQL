import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCampgrounds, getAllCampgroundsForMap } from '../../api/campgrounds';
import MapboxMap from '../../components/MapboxMap';
import CardSkeleton from '../../components/ui/CardSkeleton';
import { useFlash } from '../../context/FlashContext';
import { timeAgo, deriveTimestampFromId } from '../../utils/timeAgo';

const CampgroundIndex = () => {
  const [campgrounds, setCampgrounds] = useState([]);
  const [allCampgroundsForMap, setAllCampgroundsForMap] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const { showFlash } = useFlash();
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollContainerRef = useRef(null);
  const [now, setNow] = useState(Date.now());

  const pageFromUrl = Math.max(
    1,
    parseInt(searchParams.get('page') || '1', 10)
  );
  const limit = 12;

  useEffect(() => {
    const fetchCampgrounds = async () => {
      try {
        const data = await getCampgrounds({ page: pageFromUrl, limit });
        setCampgrounds(data.items);
        setMeta({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
          hasNext: data.hasNext,
          hasPrev: data.hasPrev,
        });
      } catch {
        showFlash('Erro ao carregar acampamentos.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCampgrounds();
    // Set a subtle page background to match the white cards
    document.body.classList.remove('home-hero');
    document.body.classList.add('camp-list-bg');
    // Enable inner scrolling with static footer/header on this page
    document.body.classList.add('camp-scroll');

    return () => {
      document.body.classList.remove('camp-list-bg');
      document.body.classList.remove('camp-scroll');
    };
  }, [showFlash, pageFromUrl]);

  // Fetch all campgrounds for map (once, on mount)
  useEffect(() => {
    const fetchAllForMap = async () => {
      try {
        const allCampgrounds = await getAllCampgroundsForMap();
        setAllCampgroundsForMap(allCampgrounds);
      } catch (error) {
        console.error('Error loading campgrounds for map:', error);
      }
    };
    fetchAllForMap();
  }, []);

  // Live update timestamps every minute
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Scroll to top after content is loaded
  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, pageFromUrl]);

  // Criar GeoJSON para o mapa de cluster (using ALL campgrounds, not just current page)
  const geoJson = React.useMemo(
    () => ({
      type: 'FeatureCollection',
      features: allCampgroundsForMap.map((campground) => ({
        type: 'Feature',
        geometry: campground.geometry,
        properties: {
          popUpMarkup: `
          <div style="min-width: 200px;">
            <h5 style="margin-bottom: 0.5rem;">${campground.title}</h5>
            <p style="margin-bottom: 0.5rem; color: #666;">${campground.location}</p>
            <a href="/campgrounds/${campground.id}" style="color: #0d6efd; text-decoration: none; font-weight: 500;">
              View Campground →
            </a>
          </div>
        `,
          title: campground.title,
          id: campground.id,
        },
      })),
    }),
    [allCampgroundsForMap]
  );

  const goToPage = (p) => {
    const next = Math.max(1, Math.min(p, meta.totalPages));
    setSearchParams({ page: String(next) });
    setLoading(true);
  };

  if (loading) {
    return (
      <>
        <div className="camp-scroll-inner" ref={scrollContainerRef}>
          {/* Modern header section - loading state */}
          <div className="campgrounds-header mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className="campgrounds-title mb-2">Explore Campgrounds</h1>
                <p className="campgrounds-subtitle text-muted mb-0">
                  Loading amazing camping destinations...
                </p>
              </div>
              <Link
                to="/campgrounds/new"
                className="btn btn-success btn-add-campground"
              >
                <span className="me-2">+</span>
                Add Campground
              </Link>
            </div>
          </div>

          <div className="map-card mb-4">
            <div
              style={{
                height: '450px',
                backgroundColor: '#e0e0e0',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
          {[...Array(6)].map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
        {/* Mobile pager fixo - fora do scroll */}
        <div className="d-md-none mobile-pager-fixed">
          <div className="container d-flex justify-content-between align-items-center">
            <button className="btn btn-outline-secondary btn-sm" disabled>
              Anterior
            </button>
            <span className="small">...</span>
            <button className="btn btn-outline-secondary btn-sm" disabled>
              Próxima
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="camp-scroll-inner" ref={scrollContainerRef}>
        {/* Modern header section */}
        <div className="campgrounds-header mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="campgrounds-title mb-2">Explore Campgrounds</h1>
              <p className="campgrounds-subtitle text-muted mb-0">
                Discover {meta.total} amazing camping destinations
              </p>
            </div>
            <Link
              to="/campgrounds/new"
              className="btn btn-success btn-add-campground"
            >
              <span className="me-2">+</span>
              Add Campground
            </Link>
          </div>
        </div>

        <div className="map-card mb-4">
          <MapboxMap
            geoJson={geoJson}
            center={[-98.583333, 39.833333]} // US center (previous default)
            zoom={3}
            // Fit to show all campgrounds on initial load
            fitToBounds={true}
            // Only animate on first load, stay static when paginating
            animateOnlyOnce={true}
            // Evitar que o mapa capture o gesto de scroll em telas pequenas
            disableInteractionOnMobile={true}
            height={450}
          />
        </div>
        {campgrounds.map((campground) => (
          <div
            className="card mb-3 camp-card position-relative"
            key={campground._id}
          >
            <div className="row">
              <div className="col-md-4">
                {campground.images && campground.images.length > 0 && (
                  <img
                    className="img-fluid camp-card-img"
                    alt=""
                    src={campground.images[0].url}
                  />
                )}
              </div>
              <div className="col-md-8">
                <div className="card-body">
                  <h5 className="card-title">{campground.title}</h5>
                  <p className="card-text">
                    {campground.description.substring(0, 100)}...
                  </p>
                  <p className="card-text">
                    <small className="text-muted">{campground.location}</small>
                  </p>
                  <p className="card-text">
                    {(() => {
                      const ts = deriveTimestampFromId(
                        campground.id,
                        campground.createdAt
                      );
                      return ts ? (
                        <small
                          className="text-muted"
                          title={new Date(ts).toLocaleString()}
                        >
                          {timeAgo(ts, now)}
                        </small>
                      ) : null;
                    })()}
                  </p>
                  <Link
                    to={`/campgrounds/${campground.id}?from=${pageFromUrl}`}
                    className="stretched-link"
                    aria-label={`Ver ${campground.title}`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Pagination controls - desktop */}
        <nav
          className="d-flex justify-content-center mt-4 mb-4"
          aria-label="Campgrounds pages"
        >
          <ul className="pagination pagination-modern">
            {/* First page */}
            <li className={`page-item ${meta.page === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => goToPage(1)}
                aria-label="First page"
                disabled={meta.page === 1}
              >
                <span aria-hidden="true">&laquo;&laquo;</span>
              </button>
            </li>

            {/* Previous */}
            <li className={`page-item ${!meta.hasPrev ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => goToPage(meta.page - 1)}
                aria-label="Previous"
                disabled={!meta.hasPrev}
              >
                <span aria-hidden="true">&laquo;</span>
              </button>
            </li>

            {/* Page numbers */}
            {(() => {
              const pages = [];
              const showPages = 5; // Show 5 page numbers
              let startPage = Math.max(
                1,
                meta.page - Math.floor(showPages / 2)
              );
              let endPage = Math.min(
                meta.totalPages,
                startPage + showPages - 1
              );

              // Adjust start if we're near the end
              if (endPage - startPage < showPages - 1) {
                startPage = Math.max(1, endPage - showPages + 1);
              }

              // First page + ellipsis if needed
              if (startPage > 1) {
                pages.push(
                  <li key={1} className="page-item">
                    <button className="page-link" onClick={() => goToPage(1)}>
                      1
                    </button>
                  </li>
                );
                if (startPage > 2) {
                  pages.push(
                    <li key="ellipsis-start" className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  );
                }
              }

              // Page numbers
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <li
                    key={i}
                    className={`page-item ${i === meta.page ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(i)}
                      aria-current={i === meta.page ? 'page' : undefined}
                    >
                      {i}
                    </button>
                  </li>
                );
              }

              // Ellipsis + last page if needed
              if (endPage < meta.totalPages) {
                if (endPage < meta.totalPages - 1) {
                  pages.push(
                    <li key="ellipsis-end" className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  );
                }
                pages.push(
                  <li key={meta.totalPages} className="page-item">
                    <button
                      className="page-link"
                      onClick={() => goToPage(meta.totalPages)}
                    >
                      {meta.totalPages}
                    </button>
                  </li>
                );
              }

              return pages;
            })()}

            {/* Next */}
            <li className={`page-item ${!meta.hasNext ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => goToPage(meta.page + 1)}
                aria-label="Next"
                disabled={!meta.hasNext}
              >
                <span aria-hidden="true">&raquo;</span>
              </button>
            </li>

            {/* Last page */}
            <li
              className={`page-item ${
                meta.page === meta.totalPages ? 'disabled' : ''
              }`}
            >
              <button
                className="page-link"
                onClick={() => goToPage(meta.totalPages)}
                aria-label="Last page"
                disabled={meta.page === meta.totalPages}
              >
                <span aria-hidden="true">&raquo;&raquo;</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Mobile pager fixo - fora do scroll, acima do footer */}
      <div className="d-md-none mobile-pager-fixed">
        <div className="container d-flex justify-content-between align-items-center">
          <button
            className="btn btn-pager"
            disabled={!meta.hasPrev}
            onClick={() => goToPage(meta.page - 1)}
            aria-label="Previous"
          >
            <span>&laquo;</span>
          </button>
          <span className="mobile-page-info">
            {meta.page} / {meta.totalPages}
          </span>
          <button
            className="btn btn-pager"
            disabled={!meta.hasNext}
            onClick={() => goToPage(meta.page + 1)}
            aria-label="Next"
          >
            <span>&raquo;</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default CampgroundIndex;
