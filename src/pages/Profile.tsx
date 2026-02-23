import React from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card, Button } from '../components/UIComponents';
import { UserCircle, Mail, Briefcase, ShieldCheck, Star, Zap, Image as ImageIcon, Check } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Profile: React.FC = () => {
  const { currentUser, updateUser } = useCRM();
  const { addToast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [newAvatar, setNewAvatar] = React.useState(currentUser?.avatarUrl || '');

  if (!currentUser) return null;

  const handleUpdateAvatar = async () => {
    try {
      await updateUser({ ...currentUser, avatarUrl: newAvatar });
      setEditing(false);
      addToast({ title: 'Perfil atualizado', type: 'success' });
    } catch (err) {
      addToast({ title: 'Erro ao atualizar', type: 'error' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-6">
      <div className="text-center relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-900 to-transparent -z-10"></div>
        <span className="bg-background px-4 text-blue-900/50 dark:text-blue-400/50 text-sm font-bold uppercase tracking-widest drop-shadow-sm">Configurações da Conta</span>
      </div>

      <Card className="overflow-hidden border-0 shadow-[0_0_40px_-10px_rgba(30,58,138,0.3)] dark:shadow-[0_0_50px_-15px_rgba(30,58,138,0.5)]">
        {/* Header Background Dopamine Blue */}
        <div className="h-36 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          {/* Glow Effects */}
          <div className="absolute -bottom-20 -right-10 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
          <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>

          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Zap className="w-96 h-96 text-white stroke-[0.5]" />
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex flex-col items-center">
            {/* Avatar Container */}
            <div className="w-32 h-32 rounded-3xl bg-white dark:bg-zinc-900 p-1.5 shadow-2xl shadow-blue-900/20 ring-1 ring-blue-50 dark:ring-blue-900/50 relative overflow-hidden group">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-5xl font-bold text-white shadow-inner shadow-blue-400/30 relative overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-2xl"
              >
                <ImageIcon className="w-8 h-8" />
              </button>
            </div>

            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-4 tracking-tight drop-shadow-sm">{currentUser.name}</h3>

            <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">{currentUser.role}</span>
            </div>

            {editing && (
              <div className="mt-4 flex gap-2 w-full max-w-sm animate-in fade-in slide-in-from-top-2">
                <input
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                  placeholder="Link da imagem de perfil..."
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                />
                <Button onClick={handleUpdateAvatar} className="!p-2 h-auto text-white bg-blue-600 hover:bg-blue-700">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {/* Card Email */}
            <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-blue-400/80 uppercase font-bold tracking-wider mb-0.5">Email Corporativo</p>
                <p className="text-zinc-900 dark:text-white font-bold text-sm break-all">{currentUser.email}</p>
              </div>
            </div>

            {/* Card Permissão (Antes Roxo, agora Azul Escuro/Elétrico) */}
            <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-indigo-400/80 uppercase font-bold tracking-wider mb-0.5">Nível de Permissão</p>
                <p className="text-zinc-900 dark:text-white font-bold text-sm capitalize">
                  {currentUser.role === 'admin' ? 'Administrador Total' : 'Vendedor'}
                </p>
              </div>
            </div>

            {/* Card ID */}
            <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-1">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-sky-400/80 uppercase font-bold tracking-wider mb-0.5">Identificador (ID)</p>
                <p className="text-zinc-900 dark:text-white font-bold text-sm font-mono">#{currentUser.id}</p>
              </div>
            </div>

            {/* Card Status */}
            <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-1">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-teal-400/80 uppercase font-bold tracking-wider mb-0.5">Status da Conta</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_currentColor]"></span>
                  <p className="text-zinc-900 dark:text-white font-bold text-sm">Ativa e Verificada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">CRM OMNI.IA v2.0</p>
      </div>
    </div>
  );
};

export default Profile;