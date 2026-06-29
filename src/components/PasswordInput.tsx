import { InputHTMLAttributes, useState } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputClassName = ['password-input__control', className].filter(Boolean).join(' ');

  return (
    <div className="password-input">
      <input {...props} type={visible ? 'text' : 'password'} className={inputClassName} />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
