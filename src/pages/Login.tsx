
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../contexts/CRMContext';
import { Button, Input, Card } from '../components/UIComponents';
import { BrainCircuit, Lock, Mail, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const { signIn, currentUser, isLoading, isUsingMockData } = useCRM();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);

    const result = await signIn(email, password);

    if (result.success) {
      addToast({ title: 'Bem-vindo!', type: 'success' });
      navigate('/dashboard');
    } else {
      setErrorStatus(result.error || 'Erro desconhecido ao fazer login.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-900/20 mb-6 transform hover:scale-105 transition-transform duration-300">
            <BrainCircuit className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            CRM <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">OFICIAL</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-lg">Inteligência Estratégica de Vendas</p>
        </div>

        <Card className="p-8 shadow-2xl border-zinc-200 dark:border-zinc-800 backdrop-blur-sm bg-surface/90">
          {isUsingMockData && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3 text-amber-700 dark:text-amber-400 text-sm animate-in fade-in slide-in-from-top-1">
              <WifiOff className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Modo Demonstração</p>
                <p className="opacity-90">Supabase não configurado. Usando dados de exemplo.</p>
              </div>
            </div>
          )}

          {errorStatus && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3 text-red-700 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Falha no Acesso</p>
                <p className="opacity-90">{errorStatus}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base !bg-gradient-to-r !from-blue-600 !to-blue-700 hover:!from-blue-700 hover:!to-blue-800 border-none shadow-lg shadow-blue-600/30 ring-offset-2 focus:ring-blue-500 gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando permissões...
                </>
              ) : 'Acessar CRM'}
            </Button>
          </form>

          {isUsingMockData && (
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <p className="text-xs text-zinc-500 mb-2">Dica:</p>
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                No modo demonstração, qualquer email/senha funcionará.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;
