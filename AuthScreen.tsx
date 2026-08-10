import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) setError(error);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-gray-200"
      style={{ background: '#0B0B0D' }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-1 mb-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #a8862a 100%)',
            boxShadow: '0 0 24px rgba(212,175,55,0.4)',
          }}
        >
          <span
            className="text-black font-extrabold text-2xl leading-none"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}
          >
            P
          </span>
        </div>
        <span
          className="text-xl font-extrabold"
          style={{ color: '#F5F5F5', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.12em' }}
        >
          PROPCONTROL
        </span>
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: '#D4AF37' }}>
          Foco • Disciplina • Liberdade
        </span>
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: '#17171C', border: '1px solid #2A2A31' }}
      >
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0B0B0D' }}>
          <button
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === 'signin' ? 'text-black' : 'text-gray-500'
            }`}
            style={mode === 'signin' ? { background: '#D4AF37' } : {}}
          >
            Entrar
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === 'signup' ? 'text-black' : 'text-gray-500'
            }`}
            style={mode === 'signup' ? { background: '#D4AF37' } : {}}
          >
            Criar Conta
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="input"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="input"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        {error && (
          <p className="text-xs font-semibold text-center" style={{ color: '#ef4444' }}>{error}</p>
        )}

        <button
          onClick={submit}
          disabled={busy || !email.trim() || !password}
          className="w-full py-3.5 rounded-2xl font-extrabold text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(90deg, #C8960C 0%, #D4AF37 50%, #B8860B 100%)' }}
        >
          {busy ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar Conta'}
        </button>

        <p className="text-[11px] text-center text-gray-600 leading-relaxed">
          {mode === 'signin'
            ? 'Entre com seu e-mail e senha para acessar suas contas e trades.'
            : 'Crie sua conta para sincronizar seus dados entre todos os seus dispositivos.'}
        </p>
      </div>
    </div>
  );
}
