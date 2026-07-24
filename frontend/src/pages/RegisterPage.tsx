import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User, Stethoscope, Users } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/context/AuthContext';

type Role = 'patient' | 'doctor' | 'family';

const roles: { id: Role; label: string; icon: typeof User; desc: string }[] = [
  { id: 'patient', label: 'Patient', icon: User, desc: 'Monitor my health' },
  { id: 'doctor', label: 'Clinician', icon: Stethoscope, desc: 'Care for patients' },
  { id: 'family', label: 'Family', icon: Users, desc: 'Watch over a loved one' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password, role);
      navigate(`/dashboard/${role}`);
    } catch (err: any) {
      console.error('Registration failed', err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join PulseGuard AI in under two minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-neon hover:underline">
            Sign in
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
        {/* Role selector */}
        <div>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            I am a
          </span>
          <div className="grid grid-cols-3 gap-3">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={[
                  'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                  role === r.id
                    ? 'border-neon/40 bg-neon/10 shadow-neon-sm'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20',
                ].join(' ')}
              >
                <r.icon
                  size={22}
                  className={role === r.id ? 'text-neon' : 'text-slate-400'}
                />
                <span
                  className={`text-xs font-medium ${role === r.id ? 'text-neon' : 'text-slate-300'}`}
                >
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <AuthInput
          label="Full name"
          placeholder="Jane Doe"
          value={name}
          onChange={setName}
        />
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
          placeholder="Create a strong password"
          icon="lock"
          value={password}
          onChange={setPassword}
        />

        <label className="flex items-start gap-3 text-sm text-slate-400">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-neon"
          />
          <span>
            I agree to the{' '}
            <a href="#" className="text-neon hover:underline">Terms</a> and{' '}
            <a href="#" className="text-neon hover:underline">Privacy Policy</a>.
          </span>
        </label>

        <NeonButton type="submit" size="lg" className="w-full group">
          Create account
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </NeonButton>
      </form>
    </AuthLayout>
  );
}
