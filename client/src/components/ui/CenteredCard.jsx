import React from 'react';

const CenteredCard = ({ title, subtitle, children, footer }) => {
  return (
    <div
      className="d-flex justify-content-center align-items-start"
      style={{ minHeight: '60vh' }}
    >
      <div className="card shadow-sm w-100" style={{ maxWidth: 520 }}>
        {(title || subtitle) && (
          <div className="card-header bg-white border-0 pb-0">
            {title && <h2 className="h4 mb-1">{title}</h2>}
            {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
          </div>
        )}
        <div className="card-body">{children}</div>
        {footer && (
          <div className="card-footer bg-white border-0 pt-0">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default CenteredCard;
