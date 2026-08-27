import './Input.css';

const Input = ({
  label,
  id,
  type = 'text',
  error,
  helpText,
  disabled = false,
  className = '',
  rightElement = null,
  ...rest
}) => {
  const inputContainerClass = `dome-form-group ${className}`.trim();
  const inputClass = `dome-form-input ${error ? 'dome-form-input--error' : ''} ${rightElement ? 'dome-form-input--with-right' : ''}`.trim();

  return (
    <div className={inputContainerClass}>
      {label && (
        <label htmlFor={id} className="dome-form-label">
          {label}
        </label>
      )}
      
      <div className="dome-input-wrapper">
        {type === 'select' ? (
          <select
            id={id}
            className={inputClass}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
            {...rest}
          >
            <option value="" disabled hidden>Select {label}</option>
            {rest.options && rest.options.map((opt, i) => (
              <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type={type}
            className={inputClass}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
            {...rest}
          />
        )}
        {rightElement && (
          <div className="dome-input-right-element">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <span id={`${id}-error`} className="dome-form-error" role="alert">
          {error}
        </span>
      )}
      {!error && helpText && (
        <span id={`${id}-help`} className="dome-form-help">
          {helpText}
        </span>
      )}
    </div>
  );
};

export default Input;
