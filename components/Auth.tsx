import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail ou faça login.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocorreu um erro na autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-slate-700 bg-slate-800/50">
          <div className="bg-violet-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/20">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">CreditFlow</h1>
          <p className="text-slate-400 text-sm">Gerencie seus gastos com inteligência.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            {message && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 mt-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setMessage(null);
                }}
                className="ml-1.5 text-violet-400 hover:text-violet-300 font-medium transition hover:underline"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Fazer Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}