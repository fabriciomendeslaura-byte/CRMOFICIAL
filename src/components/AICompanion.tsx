
import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { ChatMessage } from '../pages/types';
import { BrainCircuit, X, Send, Bot, User, Sparkles } from 'lucide-react';

const AICompanion: React.FC = () => {
    const { chatWithAI, currentUser, leads, chatHistory, isLoadingChat, addMessage } = useCRM();
    const [isOpen, setIsOpen] = useState(false);

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [lastMessageId, setLastMessageId] = useState<string | null>(null);

    // Ref to track if it's the initial load of history
    const isInitialLoad = useRef(true);

    // Effect to handle new messages (badges/scroll)
    useEffect(() => {
        if (chatHistory.length > 0) {
            const lastMsg = chatHistory[chatHistory.length - 1];

            if (lastMsg.id !== lastMessageId) {
                setLastMessageId(lastMsg.id);

                // Only trigger unread if it's NOT the first load
                if (!isInitialLoad.current) {
                    if (!isOpen) setHasUnread(true);
                }

                // Always scroll to bottom on new message
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }
        }

        // Logic to clear "Initial Load" state
        if (!isLoadingChat) {
            // If we have history, or if it's empty but loaded, we are done with init
            // We use a small timeout to ensure the first render doesn't trigger the badge
            const timer = setTimeout(() => {
                isInitialLoad.current = false;
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [chatHistory, isOpen, lastMessageId, isLoadingChat]);

    // Alive Logic: Greeting
    useEffect(() => {
        // Trigger only if user is loaded, chat is loaded, and history is EMPTY
        if (currentUser?.name && !isLoadingChat && chatHistory.length === 0) {
            const timer = setTimeout(() => {
                const hour = new Date().getHours();
                const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
                const firstName = currentUser.name.split(' ')[0];
                const text = `${greeting}, ${firstName}! 🚀\nEstou pronto para te ajudar a vender mais hoje.`;

                addMessage('assistant', text);
                // The explicit addMessage will trigger the main useEffect. 
                // Since this happens after 1.5s, isInitialLoad will likely be false (set to false after 0.5s), 
                // so this Greeting WILL trigger the badge, which is what we want for a NEW greeting.
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [currentUser, isLoadingChat, chatHistory.length, isOpen, addMessage]);

    // Clear badge on open
    useEffect(() => {
        if (isOpen) setHasUnread(false);
    }, [isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const originalInput = input;
        setInput('');
        setIsTyping(true);

        try {
            await chatWithAI(originalInput);
        } catch (error) {
            console.error("AI Error", error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Floating Robot Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-110 transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.8)] group animate-bounce-subtle"
                >
                    <div className="relative">
                        <Bot className="w-7 h-7" />
                        {hasUnread && chatHistory.length > 0 && (
                            <div className="absolute bottom-full right-0 mb-3 w-48 bg-white dark:bg-zinc-900 p-3 rounded-2xl rounded-br-none shadow-xl border border-indigo-100 dark:border-zinc-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Omni-Bot diz:</p>
                                <p className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                                    {chatHistory[chatHistory.length - 1].content}
                                </p>
                            </div>
                        )}
                    </div>
                    <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                        Omni-Bot Online
                    </span>
                </button>
            )}

            {/* Chat Interface - SOLID BACKGROUND */}
            <div className={`
        fixed bottom-6 right-6 z-50 
        w-[90vw] md:w-[400px] h-[70vh] md:h-[600px] 
        bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col 
        transition-all duration-500 ease-in-out border border-zinc-200 dark:border-zinc-800 
        ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-0 translate-y-20 opacity-0 pointer-events-none'}
      `}>
                {/* Header */}
                <div className="p-5 flex justify-between items-center bg-indigo-50 dark:bg-zinc-800/50 rounded-t-3xl border-b border-indigo-100 dark:border-zinc-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-900 dark:text-white leading-none">Omni-Bot</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Consultor Estratégico</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scroll space-y-4 bg-zinc-50/50 dark:bg-black/20">
                    {isLoadingChat && chatHistory.length === 0 && (
                        <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
                    )}

                    {!isLoadingChat && chatHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 dark:border-zinc-700">
                                <Sparkles className="w-8 h-8 text-indigo-500" />
                            </div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Olá! Eu sou o Omni-Bot.</p>
                            <p className="text-xs text-zinc-500">Estou aqui para te ajudar com insights de vendas, scripts e análise de performance. Pergunte-me sobre seus leads!</p>
                        </div>
                    )}

                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 text-indigo-500 border border-indigo-100 dark:border-zinc-700'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`
                  max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-zinc-700'}
               `}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <span className={`text-[9px] mt-1 block opacity-50 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-zinc-700">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl flex gap-1 items-center border border-zinc-100 dark:border-zinc-700">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-3xl">
                    <div className="relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte algo ao Omni-Bot..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:bg-zinc-400 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-indigo-500/20"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[9px] text-zinc-500 text-center mt-3 font-bold uppercase tracking-widest opacity-50">Powered by Omni.ia Thinking</p>
                </form>
            </div>
        </>
    );
};

export default AICompanion;
