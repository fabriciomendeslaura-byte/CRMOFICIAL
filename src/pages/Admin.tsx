import React, { useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card, Button, Input, Modal, Select } from '../components/UIComponents';
import { User } from './types';
import { Edit2, Shield, AlertTriangle, UserCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Admin: React.FC = () => {
    const { users, currentUser, updateUser } = useCRM();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    if (!currentUser || currentUser.role !== 'admin') {
        return <Navigate to="/dashboard" />;
    }

    const handleOpenEdit = (user: User) => {
        setEditingUser({ ...user });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser?.name || !editingUser?.id) return;

        // Atualiza apenas Nome e Papel
        updateUser(editingUser as User);

        setIsModalOpen(false);
        setEditingUser(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-normal">Gestão de Usuários</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Controle de acesso e equipe.</p>
                </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-800/30 p-5 rounded-2xl flex items-start gap-4 text-amber-900 dark:text-amber-100 shadow-sm">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-sm mb-1">Aviso de Sistema</h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                        A criação de novos usuários e a exclusão de contas são gerenciadas diretamente no banco de dados central.
                        Utilize esta tela para atualizar nomes ou alterar níveis de privilégio (Admin/Vendedor).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <Card key={user.id} className="p-6 group hover:border-blue-800 dark:hover:border-blue-700 transition-colors">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${user.role === 'admin'
                                    ? 'bg-gradient-to-br from-blue-800 to-blue-950 text-blue-100 shadow-blue-900/20'
                                    : 'bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 text-zinc-600 dark:text-zinc-300'
                                    }`}>
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{user.name}</h3>
                                    <p className="text-xs text-zinc-500">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.role === 'admin'
                                ? 'bg-blue-900/30 text-blue-200 border-blue-800'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                }`}>
                                {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(user)} className="text-zinc-400 hover:text-blue-400">
                                <Edit2 className="w-4 h-4 mr-1" /> Editar
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Usuário">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500">Nome</label>
                        <Input
                            placeholder="Nome"
                            value={editingUser?.name || ''}
                            onChange={e => setEditingUser(p => ({ ...p, name: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500">Email (Somente leitura)</label>
                        <Input
                            value={editingUser?.email || ''}
                            disabled
                            className="opacity-70 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500">Nível de Acesso</label>
                        <Select value={editingUser?.role || 'vendedor'} onChange={e => setEditingUser(p => ({ ...p, role: e.target.value as any }))}>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Administrador</option>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl mt-2">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-snug">
                            <strong>Nota:</strong> Administradores possuem acesso irrestrito a todos os leads, configurações e dados da empresa.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20">Salvar Alterações</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Admin;

