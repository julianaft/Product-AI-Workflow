import { useId } from 'react';
import { INPUT, classNames } from './ui.js';

function Wrapper({ id, label, hint, error, required, children }) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-bold mb-1">
        {label}
        {required ? <span className="text-ember"> *</span> : null}
      </label>
      {hint ? <p className="text-sm mb-2 text-blue">{hint}</p> : null}
      {children}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-ember mt-1">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ label, hint, error, required, value, onChange, onBlur, placeholder }) {
  const id = useId();

  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        type="text"
        className={classNames(INPUT, error && 'border-ember')}
        value={value ?? ''}
        placeholder={placeholder}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  onBlur,
  rows = 4,
  placeholder,
}) {
  const id = useId();

  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={rows}
        className={classNames(INPUT, 'resize-y', error && 'border-ember')}
        value={value ?? ''}
        placeholder={placeholder}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
    </Wrapper>
  );
}
