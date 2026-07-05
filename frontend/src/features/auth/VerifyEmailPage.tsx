import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { resendVerification } from './auth-api';
import { getAuthErrorMessage } from './form-errors';
import { useAuth } from './useAuth';

type VerifyEmailFormValues = {
  email: string;
  otp: string;
};

type LocationState = {
  email?: string;
};

export function VerifyEmailPage() {
  const { isAuthenticated, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({
    defaultValues: {
      email: state?.email ?? '',
      otp: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: VerifyEmailFormValues) {
    setFormError(null);
    setFormMessage(null);

    try {
      await verifyEmail(values);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to verify email. Please try again.'));
    }
  }

  async function onResend() {
    const email = getValues('email');

    if (!email) {
      setFormError('Enter your email before requesting a new code.');
      return;
    }

    setIsResending(true);
    setFormError(null);
    setFormMessage(null);

    try {
      const response = await resendVerification(email);
      setFormMessage(response.message);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to resend code. Please try again.'));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Check email</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white">Verify your account</h1>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
          <button
            type="button"
            disabled={isResending}
            onClick={onResend}
            className="rounded-md border border-white/10 px-4 py-3 font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isResending ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
      </form>
    </div>
  );
}
