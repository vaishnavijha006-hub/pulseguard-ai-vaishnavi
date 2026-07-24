import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard/patient');
    } catch (err: any) {
      console.error('Login failed', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your intelligent health guardian."
      footer={
        <>
          New to PulseGuard?{' '}
          <Link to="/register" className="font-medium text-neon hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon="mail"
          value={email}
          onChange={setEmail}
        />
        <AuthInput
          label="Password"
          type="password"
          placeholder="••••••••"
          icon="lock"
          value={password}
          onChange={setPassword}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-neon"
            />
            Remember me
          </label>
          <a href="#" className="text-neon hover:underline">
            Forgot password?
          </a>
        </div>

        <NeonButton type="submit" size="lg" className="w-full group">
          Sign in
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </NeonButton>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-base px-3 text-xs text-slate-500">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-slate-300 transition hover:border-neon/30 hover:text-neon"
          >
            <ShieldCheck size={16} />
            SSO
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-slate-300 transition hover:border-neon/30 hover:text-neon"
          >
            <span className="font-mono text-xs">⬡</span>
            Wallet
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
