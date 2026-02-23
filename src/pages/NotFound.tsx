import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UIComponents';
import { Compass, MoveLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]"></div>

      <div className="relative z-10 text-center max-w-lg">
        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-zinc-200/50 dark:shadow-black/30 border border-zinc-200 dark:border-zinc-800 rotate-12">
           <Compass className="w-12 h-12 text-zinc-400 dark:text-zinc-500" />
        </div>
        
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-zinc-800 to-zinc-400 dark:from-white dark:to-zinc-600 tracking-tighter mb-2">
          404
        </h1>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
          Página não encontrada
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-lg">
          Parece que você se aventurou em um território desconhecido do nosso CRM.
        </p>
        
        <Button onClick={() => navigate('/dashboard')} size="lg" className="gap-2 shadow-xl shadow-blue-500/20">
          <MoveLeft className="w-5 h-5" />
          Voltar para Segurança
        </Button>
      </div>
    </div>
  );
};

export default NotFound;