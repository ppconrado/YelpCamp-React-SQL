import React from 'react';

const CardSkeleton = () => {
  return (
    <div className="card mb-3 camp-card">
      <div className="row">
        <div className="col-md-4">
          <div
            className="skeleton-img camp-card-img"
            style={{
              backgroundColor: '#e0e0e0',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        <div className="col-md-8">
          <div className="card-body">
            <div
              className="skeleton-text mb-3"
              style={{
                height: '24px',
                width: '70%',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              className="skeleton-text mb-2"
              style={{
                height: '16px',
                width: '100%',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                animationDelay: '0.1s',
              }}
            />
            <div
              className="skeleton-text mb-2"
              style={{
                height: '16px',
                width: '85%',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                animationDelay: '0.2s',
              }}
            />
            <div
              className="skeleton-text"
              style={{
                height: '14px',
                width: '50%',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                animationDelay: '0.3s',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;
