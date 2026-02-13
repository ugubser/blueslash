import React from 'react';

interface ToggleControlProps {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  useMobileStyle?: boolean;
}

/**
 * Reusable toggle control component that switches between
 * a checkbox-style toggle (desktop) and a button-style toggle (mobile).
 */
const ToggleControl: React.FC<ToggleControlProps> = ({
  id,
  checked,
  disabled = false,
  onChange,
  useMobileStyle = false,
}) => {
  if (useMobileStyle) {
    return (
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`w-auto px-4 py-1.5 border-2 rounded-lg text-sm font-semibold transition-colors ${
          checked
            ? 'bg-mario-green text-white border-mario-green'
            : 'bg-gray-100 text-gray-600 border-gray-200'
        } ${
          disabled
            ? 'opacity-60 cursor-not-allowed'
            : 'cursor-pointer hover:brightness-105'
        }`}
      >
        {checked ? 'On' : 'Off'}
      </button>
    );
  }

  return (
    <div className="flex w-full sm:w-auto sm:justify-end">
      <label className="mario-toggle ml-auto" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        <span className={`mario-toggle-slider ${disabled ? 'opacity-50' : ''}`}></span>
      </label>
    </div>
  );
};

export default ToggleControl;
