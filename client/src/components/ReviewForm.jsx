import React, { useState } from 'react';
import { createReview } from '../api/reviews';
import { useFlash } from '../context/FlashContext';

const ReviewForm = ({ campgroundId, onReviewAdded }) => {
  const [formData, setFormData] = useState({
    rating: 3,
    body: '',
  });
  const [loading, setLoading] = useState(false);
  const { showFlash } = useFlash();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createReview(campgroundId, { review: formData });
      showFlash(response.message, 'success');
      onReviewAdded(response.review);
      setFormData({ rating: 3, body: '' }); // Reset form
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao adicionar review.';
      showFlash(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Leave a Review</h2>
      <form onSubmit={handleSubmit} className="mb-3 validated-form" noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="rating">Rating</label>
          <input
            className="form-range"
            type="range"
            min="1"
            max="5"
            id="rating"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            required
          />
          <span>{formData.rating} Stars</span>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="body">Review Text</label>
          <textarea
            className="form-control"
            id="body"
            name="body"
            rows="3"
            value={formData.body}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <button className="btn btn-success" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
