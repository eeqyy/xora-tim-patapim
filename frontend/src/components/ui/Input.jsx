// ============================================================
// XORA — Input, Textarea, Select dengan label/helper/error
// frontend/src/components/ui/Input.jsx
// ============================================================

import React from "react";

function Field({ label, helper, error, id, required, children }) {
  return (
    <div className="ui-field">
      {label && (
        <label className="ui-label" htmlFor={id}>
          {label}
          {required && (
            <span className="ui-label-req" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="ui-field-msg ui-field-error" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p className="ui-field-msg">{helper}</p>
      ) : null}
    </div>
  );
}

export function Input({ label, id, error, helper, required, className = "", ...rest }) {
  const fieldId = id || rest.name;
  return (
    <Field label={label} helper={helper} error={error} id={fieldId} required={required}>
      <input
        id={fieldId}
        className={["ui-input", error ? "ui-input-error" : "", className].filter(Boolean).join(" ")}
        required={required}
        aria-invalid={Boolean(error)}
        {...rest}
      />
    </Field>
  );
}

export function Textarea({ label, id, error, helper, required, className = "", ...rest }) {
  const fieldId = id || rest.name;
  return (
    <Field label={label} helper={helper} error={error} id={fieldId} required={required}>
      <textarea
        id={fieldId}
        className={["ui-input", error ? "ui-input-error" : "", className].filter(Boolean).join(" ")}
        required={required}
        aria-invalid={Boolean(error)}
        {...rest}
      />
    </Field>
  );
}

export function Select({ label, id, error, helper, required, className = "", children, ...rest }) {
  const fieldId = id || rest.name;
  return (
    <Field label={label} helper={helper} error={error} id={fieldId} required={required}>
      <select
        id={fieldId}
        className={["ui-input", error ? "ui-input-error" : "", className].filter(Boolean).join(" ")}
        required={required}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
}

export default Input;