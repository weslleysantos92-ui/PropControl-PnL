import { useEffect, useState } from 'react';
import { Home, CalendarDays, Brain, Banknote, Footprints, Calendar, LogOut } from 'lucide-react';
import { AppProvider } from '@/store';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AuthScreen } from '@/screens/AuthScreen';
import { Dashboard } from '@/screens/Dashboard';
import { AccountDetail } from '@/screens/AccountDetail';
import { Calendar as CalendarScreen } from '@/screens/Calendar';
import { Journey } from '@/screens/Journey';
import { Finances } from '@/screens/Finances';
import { Intelligence } from '@/screens/Intelligence';

const DAYS_PT = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function GreetingBar() {
  const now = new Date();
  const weekday = DAYS_PT[now.getDay()];
  const full = `${now.getDate()} de ${MONTHS_PT[now.getMonth()]}, ${now.getFullYear()}`;
  return (
    <div className="flex items-center justify-between px-0 py-3">
      <div>
        <h1 className="text-[17px] font-extrabold text-white leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {getGreeting()}, Weslley! 👊
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
          Foco total na execução. Um trade de cada vez.
        </p>
      </div>
      <div
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 flex-shrink-0 ml-3"
        style={{ background: '#17171C', border: '1px solid #2A2A31' }}
      >
        <Calendar size={13} style={{ color: '#D4AF37' }} strokeWidth={2} />
        <div className="text-right">
          <div className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>{weekday}</div>
          <div className="text-[10px] font-bold" style={{ color: '#F5F5F5' }}>{full}</div>
        </div>
      </div>
    </div>
  );
}
type Tab = 'dashboard' | 'calendario' | 'jornada' | 'financas' | 'analise';

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'dashboard',  label: 'Dashboard',    icon: Home },
  { id: 'calendario', label: 'Calendário',   icon: CalendarDays },
  { id: 'analise',    label: 'Inteligência', icon: Brain },
  { id: 'financas',   label: 'Financeiro',   icon: Banknote },
  { id: 'jornada',    label: 'Jornada',      icon: Footprints },
];

function AppContent() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);

  const openAccount  = (id: string) => setOpenAccountId(id);
  const closeAccount = () => setOpenAccountId(null);

  return (
    <div
      className="min-h-screen text-gray-200 max-w-md mx-auto relative"
      style={{ background: '#0B0B0D' }}
    >
      {openAccountId ? (
        <AccountDetail accountId={openAccountId} onBack={closeAccount} />
      ) : (
        <>
          {/* ── Header ── */}
          <header
            className="safe-top px-5 pt-4 pb-0"
            style={{ borderBottom: '1px solid rgba(42,42,49,0.6)' }}
          >
            {/* Logo centrado */}
            <div className="flex flex-col items-center gap-0.5 pb-3" style={{ borderBottom: '1px solid rgba(42,42,49,0.4)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #a8862a 100%)',
                    boxShadow: '0 0 12px rgba(212,175,55,0.35)',
                  }}
                >
                  <span
                    className="text-black font-extrabold text-base leading-none"
                    style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}
                  >
                    P
                  </span>
                </div>
                <span
                  className="text-[17px] font-extrabold"
                  style={{ color: '#F5F5F5', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.12em' }}
                >
                  PROPCONTROL
                </span>
              </div>
              <span className="text-[9px] font-semibold tracking-[0.25em] uppercase" style={{ color: '#D4AF37' }}>
                Foco&nbsp;•&nbsp;Disciplina&nbsp;•&nbsp;Liberdade
              </span>
            </div>

            {/* Saudão + Data — parte do header, abaixo do logo */}
            <GreetingBar />
          </header>

          <main>
            {tab === 'dashboard' && <Dashboard onOpenAccount={openAccount} />}
            {tab === 'calendario' && <CalendarScreen />}
            {tab === 'analise'    && <Intelligence />}
            {tab === 'jornada'    && <Journey />}
            {tab === 'financas'   && <Finances />}
          </main>
        </>
      )}

      {/* ── Bottom Nav ── */}
      <nav
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-md z-30"
        style={{
          bottom: '52px',
          background: 'rgba(15,15,18,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(42,42,49,0.8)',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <div className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = tab === t.id && !openAccountId;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); closeAccount(); }}
                className="flex flex-col items-center gap-1 py-3 relative transition-all duration-200"
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                    style={{ background: '#D4AF37' }}
                  />
                )}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={active ? { background: 'rgba(212,175,55,0.12)' } : {}}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                    style={{ color: active ? '#D4AF37' : '#4B5563' }}
                  />
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? '#D4AF37' : '#4B5563', fontFamily: 'Manrope, sans-serif' }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Logout button ── */}
      <button
        onClick={() => supabase.auth.signOut()}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{ background: '#17171C', border: '1px solid #2A2A31' }}
        title="Sair"
      >
        <LogOut size={16} style={{ color: '#4B5563' }} />
      </button>
    </div>
  );
}

function Root() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0B0B0D' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #a8862a 100%)',
            boxShadow: '0 0 24px rgba(212,175,55,0.4)',
          }}
        >
          <span
            className="text-black font-extrabold text-xl leading-none"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            P
          </span>
        </div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
