import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, Mail, Lock, User, Building, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/UIComponents';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/app/dashboard', { replace: true });
    };
    checkAuth();
  }, [navigate]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            company_name: formData.companyName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Note: In a real production app, you'd use a database trigger/function 
        // to create the crm_users and crm_companies records. 
        // For simplicity here, we assume the user needs to confirm email or admin handles it.
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center glass border-emerald-500/30">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Conta Criada!</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Verifique seu e-mail para confirmar o cadastro. Redirecionando para o login...
            </p>
            <Link to="/login" className="text-indigo-500 font-bold hover:underline">
              Ir para Login agora
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] -ml-64 -mb-64" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <BrainCircuit className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
            Crie sua conta no <span className="text-indigo-500">CRM.OFICIAL</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Transforme sua gestão de leads com inteligência artificial.
          </p>
        </div>

        <Card className="p-8 glass card-hover border-white/20 dark:border-white/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  className="pl-10 h-12"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Nome da Empresa</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  className="pl-10 h-12"
                  placeholder="Minha Empresa S/A"
                  value={formData.companyName}
                  onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="email"
                  className="pl-10 h-12"
                  placeholder="voce@empresa.com"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="password"
                  className="pl-10 h-12"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500 text-center font-medium bg-red-500/10 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Começar agora <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-white/5 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Já possui uma conta?{' '}
              <Link to="/login" className="text-indigo-500 font-bold hover:underline">
                Ir para Login agora
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-8 px-4 uppercase tracking-widest font-bold">
          Segurança CRM.OFICIAL &copy; 2026. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
