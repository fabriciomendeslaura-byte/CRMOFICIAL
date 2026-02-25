import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Target, ArrowRight, BarChart3, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoNew from '../assets/logo-new.png';
import IsolatedLogo from '../components/ui/IsolatedLogo';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Target className="w-6 h-6" />,
            title: "IA Estratégica",
            description: "Análise proativa de leads e insights preditivos para fechar mais negócios."
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Soberania de Dados",
            description: "Segurança de nível bancário com políticas de Row Level Security (RLS) avançadas."
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Performance Titan",
            description: "Arquitetura ultra-veloz baseada em Vite e Supabase para resposta instantânea."
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden font-['Outfit']">
            {/* Background Kinetic Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
            </div>

            {/* Navigation Header */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-8 container mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center"
                >
                    <IsolatedLogo
                        src={logoNew}
                        alt="CRM.OFICIAL"
                        threshold={45}
                        className="h-20 md:h-24 w-auto drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    />
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/login')}
                    className="glass px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-500 group"
                >
                    <span className="flex items-center gap-2">
                        Acessar Sistema <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </motion.button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-40 container mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-[10px] font-black tracking-[0.5em] uppercase text-blue-500 mb-6 flex items-center justify-center gap-4">
                        <span className="w-8 h-[1px] bg-blue-500/30"></span>
                        CRM.OFICIAL Strategic Intelligence
                        <span className="w-8 h-[1px] bg-blue-500/30"></span>
                    </h2>

                    <h1 className="text-5xl md:text-8xl font-black italic mb-8 leading-[0.9] tracking-tight">
                        A NOVA ERA DA <br />
                        <span className="text-gradient">SOBERANIA CRM</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl font-light leading-relaxed mb-12">
                        Transforme dados brutos em poder estratégico. O CRM.OFICIAL combina automação avançada com segurança soberana para elevar seu funil de vendas ao nível Titan.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-xl font-bold transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] transform hover:-translate-y-1"
                        >
                            Iniciar Operação
                        </button>
                        <button className="w-full md:w-auto glass border border-white/10 px-10 py-5 rounded-xl font-bold hover:bg-white/5 transition-all">
                            Ver Documentação
                        </button>
                    </div>
                </motion.div>

                {/* Floating HUD Elements (Simulation) */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            className="glass p-8 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all duration-500 text-left group"
                        >
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform duration-500">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 italic tracking-tight">{feature.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-light">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Stats/Proof Section */}
            <section className="py-20 bg-blue-600/5 border-y border-blue-500/10">
                <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    <div>
                        <div className="text-4xl font-black mb-2 tracking-tighter">99.9%</div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Uptime Soberano</div>
                    </div>
                    <div>
                        <div className="text-4xl font-black mb-2 tracking-tighter">+450%</div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Conversão Líquida</div>
                    </div>
                    <div>
                        <div className="text-4xl font-black mb-2 tracking-tighter">ZERO</div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Data Leaks</div>
                    </div>
                    <div>
                        <div className="text-4xl font-black mb-2 tracking-tighter">&lt; 100ms</div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Latência de IA</div>
                    </div>
                </div>
            </section>

            {/* Footer Branding */}
            <footer className="py-20 px-6 container mx-auto flex flex-col items-center">
                <IsolatedLogo
                    src={logoNew}
                    alt="CRM.OFICIAL"
                    threshold={45}
                    className="h-32 opacity-20 grayscale mb-8"
                />
                <p className="text-[8px] font-black tracking-[0.8em] text-white/20 uppercase">
                    Precision Engineered for the Sovereign Human
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
