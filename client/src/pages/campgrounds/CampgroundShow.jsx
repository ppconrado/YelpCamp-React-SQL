import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { getCampground, deleteCampground } from '../../api/campgrounds';
import { deleteReview } from '../../api/reviews';
import MapboxMap from '../../components/MapboxMap';
import ReviewForm from '../../components/ReviewForm';
import ImageCarousel from '../../components/ImageCarousel';
import ConfirmModal from '../../components/ui/ConfirmModal';
import DetailSkeleton from '../../components/ui/DetailSkeleton';
import { useFlash } from '../../context/FlashContext';
import { useAuth } from '../../context/AuthContext';
import { timeAgo, deriveTimestampFromId } from '../../utils/timeAgo';

const CampgroundShow = () => {
  const [campground, setCampground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [now, setNow] = useState(Date.now());
  const { id } = useParams();
  const { showFlash } = useFlash();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnPage = searchParams.get('from') || '1';

  const handleReviewAdded = (newReview) => {
    setCampground((prev) => ({
      ...prev,
      reviews: [...prev.reviews, newReview],
    }));
  };

  const handleReviewDelete = async (reviewId) => {
    setReviewToDelete(reviewId);
  };

  const confirmReviewDelete = async () => {
    if (!reviewToDelete) return;
    try {
      const response = await deleteReview(id, reviewToDelete);
      showFlash(response.message, 'success');
      setCampground((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((review) => review._id !== reviewToDelete),
      }));
    } catch {
      showFlash('Erro ao remover review.', 'error');
    } finally {
      setReviewToDelete(null);
    }
  };

  useEffect(() => {
    const fetchCampground = async () => {
      try {
        const data = await getCampground(id);
        setCampground(data);
      } catch {
        showFlash('Não foi possível encontrar este acampamento!', 'error');
        navigate('/campgrounds');
      } finally {
        setLoading(false);
      }
    };
    fetchCampground();
    // SPA feel: background + inner scroll with static header/footer
    document.body.classList.remove('home-hero');
    document.body.classList.add('camp-list-bg');
    document.body.classList.add('camp-scroll');
    return () => {
      document.body.classList.remove('camp-list-bg');
      document.body.classList.remove('camp-scroll');
    };
  }, [id, showFlash, navigate]);

  // Live-update relative timestamps every 60s
  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCampground(id);
      showFlash('O acampamento foi removido com sucesso!', 'success');
      navigate('/campgrounds');
    } catch {
      showFlash('Erro ao remover acampamento.', 'error');
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!campground) {
    return null;
  }

  const isAuthor =
    currentUser &&
    campground.author &&
    campground.author._id === currentUser._id;

  // Criar GeoJSON para o mapa individual
  const geoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: campground.geometry,
        properties: {
          popUpMarkup: `<h5>${campground.title}</h5><p>${campground.location}</p>`,
        },
      },
    ],
  };

  return (
    <div className="camp-scroll-inner">
      {/* Breadcrumb / Back button */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/campgrounds?page=${returnPage}`}>Campgrounds</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {campground.title}
          </li>
        </ol>
      </nav>

      {/* Top section: Images/details (left) and Map (right) */}
      <div className="row">
        <div className="col-md-8">
          <div
            className="card mb-4 shadow-sm"
            style={{ backgroundColor: '#fff' }}
          >
            {campground.images && campground.images.length > 0 && (
              <ImageCarousel
                images={campground.images}
                id={`campCarousel-${campground._id}`}
                altPrefix={campground.title}
                captionTitle={campground.title}
                captionSubtitle={campground.location}
              />
            )}
            <div className="card-body">
              <h5 className="card-title">{campground.title}</h5>
              <p className="card-text text-secondary">
                {campground.description}
              </p>
            </div>
            <ul className="list-group list-group-flush">
              <li
                className="list-group-item text-muted"
                style={{ backgroundColor: '#f8f9fa' }}
              >
                {campground.location}
              </li>
              <li
                className="list-group-item"
                style={{ backgroundColor: '#fff' }}
              >
                Submitted by {campground.author.username}
              </li>
              <li
                className="list-group-item fw-bold"
                style={{ backgroundColor: '#fff' }}
              >
                ${campground.price}
              </li>
            </ul>
            {isAuthor && (
              <div className="card-body d-flex gap-2">
                <Link
                  className="btn btn-info"
                  to={`/campgrounds/${campground._id}/edit`}
                >
                  Edit
                </Link>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            )}
            <div
              className="card-footer text-muted"
              style={{ backgroundColor: '#f8f9fa' }}
            >
              {(() => {
                const ts = deriveTimestampFromId(
                  campground._id,
                  campground.createdAt
                );
                return ts ? (
                  <span title={new Date(ts).toLocaleString()}>
                    {timeAgo(ts, now)}
                  </span>
                ) : (
                  <span />
                );
              })()}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4 sticky-md shadow-sm">
            <div className="card-body p-0">
              <MapboxMap
                geoJson={geoJson}
                center={campground.geometry.coordinates}
                zoom={10}
                height={400}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Reviews list (left) and form (right) */}
      <div className="row mt-4">
        <div className="col-md-8">
          <h2 className="mb-4">Reviews</h2>
          {campground.reviews.map((review) => (
            <div
              key={review._id}
              className="card mb-4 shadow-sm"
              style={{ backgroundColor: '#fff' }}
            >
              <div className="card-body">
                <h6 className="card-subtitle mb-2 text-muted">
                  By {review.author.username}{' '}
                  {(() => {
                    const ts = deriveTimestampFromId(
                      review._id,
                      review.createdAt
                    );
                    return ts ? (
                      <small
                        className="text-muted"
                        title={new Date(ts).toLocaleString()}
                      >
                        · {timeAgo(ts, now)}
                      </small>
                    ) : null;
                  })()}
                </h6>
                <p className="card-text">Rating: {review.rating}</p>
                <p className="card-text text-secondary">{review.body}</p>
                {currentUser && review.author._id === currentUser._id && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleReviewDelete(review._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="col-md-4">
          {currentUser && (
            <div className="card shadow-sm" style={{ backgroundColor: '#fff' }}>
              <div className="card-body">
                <ReviewForm
                  campgroundId={campground._id}
                  onReviewAdded={handleReviewAdded}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation modals */}
      <ConfirmModal
        show={showDeleteModal}
        title="Delete Campground"
        message="Tem certeza que deseja remover este acampamento? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <ConfirmModal
        show={!!reviewToDelete}
        title="Delete Review"
        message="Tem certeza que deseja remover esta review?"
        onConfirm={confirmReviewDelete}
        onCancel={() => setReviewToDelete(null)}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default CampgroundShow;
