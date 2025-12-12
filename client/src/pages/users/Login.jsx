import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginUser } from '../../api/auth';
import { useFlash } from '../../context/FlashContext';
import { useAuth } from '../../context/AuthContext';
import CenteredCard from '../../components/ui/CenteredCard';
import SubmitButton from '../../components/ui/SubmitButton';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

const loginSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Password é obrigatória'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { showFlash } = useFlash();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useUnsavedChanges(isDirty && !isSubmitting);

  const onSubmit = async (data) => {
    try {
      const response = await loginUser(data);
      login(response.user);
      showFlash(response.message, 'success');
      const redirectTo = location.state?.from?.pathname || '/campgrounds';
      navigate(redirectTo);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        'Erro ao fazer login. Verifique suas credenciais.';
      showFlash(errorMessage, 'error');
    }
  };

  return (
    <CenteredCard
      title="Login"
      subtitle="Acesse sua conta para criar e revisar campings"
      footer={
        <p className="mb-0">
          Novo por aqui? <Link to="/register">Crie sua conta</Link>
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
            type={showPassword ? 'text' : 'password'}
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            id="password"
            placeholder="Password"
            autoComplete="current-password"
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

        <SubmitButton loading={isSubmitting}>Login</SubmitButton>
      </form>
    </CenteredCard>
  );
};

export default Login;
