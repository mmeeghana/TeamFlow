import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from './auth-api';
import { getAuthErrorMessage } from './form-errors';

type ForgotPasswordFormValues = {
  email: string;
};

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ defaultValues: { email: '' } });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);

    try {
      await forgotPassword(values);
      navigate('/reset-password', { replace: true, state: { email: values.email } });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to send reset code. Please try again.'));
    }
  }

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Password reset</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white">Forgot password</h1>
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
          {isSubmitting ? 'Sending...' : 'Send reset code'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-300">
        Remembered it?{' '}
        <Link className="font-medium text-cyan-300 hover:text-cyan-200" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
