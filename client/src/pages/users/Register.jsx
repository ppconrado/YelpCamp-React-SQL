import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerUser } from '../../api/auth';
import { useFlash } from '../../context/FlashContext';
import { useAuth } from '../../context/AuthContext';
import CenteredCard from '../../components/ui/CenteredCard';
import SubmitButton from '../../components/ui/SubmitButton';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

const registerSchema = z.object({
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 8 caracteres'),
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { showFlash } = useFlash();
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  useUnsavedChanges(isDirty && !isSubmitting);

  const onSubmit = async (data) => {
    try {
      const response = await registerUser(data);
      login(response.user);
      showFlash(response.message, 'success');
      navigate('/campgrounds');
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Erro ao registrar usuário.';
      showFlash(errorMessage, 'error');
    }
  };

  return (
    <CenteredCard
      title="Create account"
      subtitle="Registre-se para começar a compartilhar seus campings favoritos"
      footer={
        <p className="mb-0">
          Já tem conta? <Link to="/login">Entre</Link>
        </p>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="validated-form"
        noValidate
      >
        <div className="form-floating mb-3">
          <input
            type="text"
            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
            id="username"
            placeholder="Username"
            autoComplete="username"
            autoFocus
            {...register('username')}
          />
          <label htmlFor="username">Username</label>
          {errors.username && (
            <div className="invalid-feedback">{errors.username.message}</div>
          )}
        </div>

        <div className="form-floating mb-3">
          <input
            type="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            id="email"
            placeholder="Email"
            autoComplete="email"
            {...register('email')}
          />
          <label htmlFor="email">Email</label>
          {errors.email && (
            <div className="invalid-feedback">{errors.email.message}</div>
          )}
        </div>

        <div className="form-floating mb-3">
          <input
            type={showPassword ? 'text' : 'password'}
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            id="password"
            placeholder="Password"
            autoComplete="new-password"
            {...register('password')}
          />
          <label htmlFor="password">Password</label>
          <button
            type="button"
            className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y me-2"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{ zIndex: 10 }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
          {errors.password && (
            <div className="invalid-feedback">{errors.password.message}</div>
          )}
        </div>

        <SubmitButton loading={isSubmitting}>Register</SubmitButton>
      </form>
    </CenteredCard>
  );
};

export default Register;
