import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message ?? 'Unable to create account. Please try again.';
  }

  return 'Unable to create account. Please try again.';
}

export function RegisterPage() {
  const { isAuthenticated, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);

    try {
      await createAccount(values);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Get started</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white">Create account</h1>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            {...register('name', {
              required: 'Name is required.',
              minLength: { value: 2, message: 'Name must be at least 2 characters.' },
            })}
          />
          {errors.name ? <p className="mt-2 text-sm text-rose-300">{errors.name.message}</p> : null}
        </div>
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
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Enter a valid email address.',
              },
            })}
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-300">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            {...register('password', {
              required: 'Password is required.',
              minLength: { value: 8, message: 'Password must be at least 8 characters.' },
            })}
          />
          {errors.password ? (
            <p className="mt-2 text-sm text-rose-300">{errors.password.message}</p>
          ) : null}
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
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-300">
        Already have an account?{' '}
        <Link className="font-medium text-cyan-300 hover:text-cyan-200" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
