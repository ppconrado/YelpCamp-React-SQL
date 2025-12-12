import React from 'react';

const SubmitButton = ({
  loading,
  children,
  className = 'btn btn-primary w-100',
}) => {
  return (
    <button type="submit" className={className} disabled={loading}>
      {loading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          {typeof children === 'string' ? `${children}...` : children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default SubmitButton;
