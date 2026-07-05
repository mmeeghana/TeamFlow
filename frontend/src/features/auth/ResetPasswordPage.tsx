import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from './auth-api';
import { getAuthErrorMessage } from './form-errors';

type ResetPasswordFormValues = {
  email: string;
  otp: string;
  newPassword: string;
};

type LocationState = {
  email?: string;
};

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { email: state?.email ?? '', otp: '', newPassword: '' },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    setFormMessage(null);

    try {
      const response = await resetPassword(values);
      setFormMessage(response.message);
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to reset password. Please try again.'));
    }
  }

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Password reset</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white">Enter reset code</h1>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            {...register('email', {
              required: 'Email is required.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' },
            })}
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-300">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="otp">
            OTP
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            {...register('otp', {
              required: 'OTP is required.',
              pattern: { value: /^\d{6}$/, message: 'OTP must be a 6-digit code.' },
            })}
          />
          {errors.otp ? <p className="mt-2 text-sm text-rose-300">{errors.otp.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            {...register('newPassword', {
              required: 'New password is required.',
              minLength: { value: 8, message: 'Password must be at least 8 characters.' },
              validate: {
                uppercase: (value) => /[A-Z]/.test(value) || 'Password needs an uppercase letter.',
                lowercase: (value) => /[a-z]/.test(value) || 'Password needs a lowercase letter.',
                number: (value) => /[0-9]/.test(value) || 'Password needs a number.',
              },
            })}
          />
          {errors.newPassword ? (
            <p className="mt-2 text-sm text-rose-300">{errors.newPassword.message}</p>
          ) : null}
        </div>
        {formMessage ? (
          <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {formMessage}
          </div>
        ) : null}
        {formError ? (
          <div className="rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {formError}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-300">
        Need a new code?{' '}
        <Link className="font-medium text-cyan-300 hover:text-cyan-200" to="/forgot-password">
          Start again
        </Link>
      </p>
    </div>
  );
}
