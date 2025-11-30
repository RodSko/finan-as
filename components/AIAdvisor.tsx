import React, { useState } from 'react';
import { MonthlyData, AIAdvice } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Sparkles, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AIAdvisorProps {
  data: MonthlyData[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ data }) => {
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (data.length === 0) return;
    setLoading(true);
    setError('');
    
    try {
      const result = await getFinancialAdvice(data);
      if (result) {
        setAdvice(result);
      } else {
        setError('Não foi possível gerar a análise no momento.');
      }
    } catch (err) {
      setError('Erro ao conectar com a IA.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Baixo': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Médio': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Alto': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-800';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Sparkles size={100} />
      </div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Gemini Financial Advisor
        </h3>
        {!advice && !loading && (
          <button
            onClick={handleAnalyze}
            disabled={data.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition flex items-center gap-2"
          >
            Analisar Finanças
          </button>
        )}
      </div>

      {loading && (
        <div className="py-8 text-center flex flex-col items-center gap-3 text-indigo-300 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Analisando seus dados de consumo...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {advice && !loading && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-start justify-between gap-4">
            <p className="text-slate-300 text-sm leading-relaxed flex-1">
              {advice.summary}
            </p>
            <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getRiskColor(advice.riskLevel)}`}>
              Risco {advice.riskLevel}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Recomendações</h4>
            <ul className="space-y-2">
              {advice.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <button 
            onClick={() => setAdvice(null)}
            className="text-xs text-slate-500 hover:text-white underline mt-2"
          >
            Resetar análise
          </button>
        </div>
      )}
      
      {!advice && !loading && data.length > 0 && (
         <p className="text-xs text-slate-500 mt-2">
           <Info className="w-3 h-3 inline mr-1"/>
           O Gemini analisará suas faturas futuras para sugerir melhorias no fluxo de caixa.
         </p>
      )}
    </div>
  );
};

export default AIAdvisor;
