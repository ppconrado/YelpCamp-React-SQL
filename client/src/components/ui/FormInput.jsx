import React from 'react';

const FormInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  name,
  required = true,
  autoComplete,
  autoFocus,
  help,
  rightSlot,
}) => {
  return (
    <div className="mb-3">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="input-group">
        <input
          className="form-control"
          type={type}
          id={id}
          name={name || id}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        {rightSlot}
      </div>
      {help && <div className="form-text">{help}</div>}
    </div>
  );
};

export default FormInput;
