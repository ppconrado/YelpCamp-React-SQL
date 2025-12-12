import React from 'react';

const DetailSkeleton = () => {
  return (
    <div className="camp-scroll-inner">
      <div className="row">
        {/* Left column: Image and details */}
        <div className="col-md-8">
          <div
            className="card mb-4 shadow-sm"
            style={{ backgroundColor: '#fff' }}
          >
            {/* Image skeleton */}
            <div
              style={{
                height: '420px',
                backgroundColor: '#e0e0e0',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
            <div className="card-body">
              {/* Title skeleton */}
              <div
                style={{
                  height: '28px',
                  width: '60%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                }}
              />
              {/* Description skeletons */}
              <div
                style={{
                  height: '16px',
                  width: '100%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.1s',
                }}
              />
              <div
                style={{
                  height: '16px',
                  width: '95%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.2s',
                }}
              />
              <div
                style={{
                  height: '16px',
                  width: '80%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.3s',
                }}
              />
            </div>
            {/* List group items skeleton */}
            <ul className="list-group list-group-flush">
              <li
                className="list-group-item"
                style={{ backgroundColor: '#f8f9fa' }}
              >
                <div
                  style={{
                    height: '16px',
                    width: '50%',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  }}
                />
              </li>
              <li
                className="list-group-item"
                style={{ backgroundColor: '#fff' }}
              >
                <div
                  style={{
                    height: '16px',
                    width: '40%',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  }}
                />
              </li>
              <li
                className="list-group-item"
                style={{ backgroundColor: '#fff' }}
              >
                <div
                  style={{
                    height: '16px',
                    width: '30%',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  }}
                />
              </li>
            </ul>
          </div>
        </div>

        {/* Right column: Map skeleton */}
        <div className="col-md-4">
          <div className="card mb-4 sticky-md shadow-sm">
            <div className="card-body p-0">
              <div
                style={{
                  height: '400px',
                  backgroundColor: '#e0e0e0',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews section skeleton */}
      <div className="row mt-4">
        <div className="col-md-8">
          <div
            style={{
              height: '32px',
              width: '150px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              marginBottom: '24px',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
          {/* Review card skeleton */}
          <div
            className="card mb-4 shadow-sm"
            style={{ backgroundColor: '#fff' }}
          >
            <div className="card-body">
              <div
                style={{
                  height: '18px',
                  width: '40%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: '16px',
                  width: '100%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: '16px',
                  width: '85%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSkeleton;
