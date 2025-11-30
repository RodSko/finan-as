import React, { useState } from 'react';
import { Transaction, Card } from '../types';
import { Trash2, CreditCard, Pencil, ChevronDown, ChevronUp, CheckCircle2, CircleDashed, Calendar } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  cards: Card[];
  invoiceStatus: Record<string, boolean>;
  onRemove: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  cards, 
  invoiceStatus,
  onRemove, 
  onEdit 
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getCardInfo = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    return card || { name: 'Desconhecido', color: '#64748b', dueDay: 10, id: 'unknown' };
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getInstallmentDate = (startMonthStr: string, installmentIndex: number, dueDay: number) => {
    const [year, month] = startMonthStr.split('-').map(Number);
    // month is 1-based from string, Date constructor takes 0-based month.
    // We add installmentIndex to the month.
    const date = new Date(year, (month - 1) + installmentIndex, dueDay);
    return date;
  };

  const isInstallmentPaid = (cardId: string, date: Date) => {
    // Format YYYY-MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${cardId}-${year}-${month}`;
    return invoiceStatus[key] || false;
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-violet-400" />
          Histórico de Compras
        </h3>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma compra registrada ainda.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/50 text-slate-300 uppercase font-medium sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="px-6 py-3 w-8"></th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Cartão</th>
                <th className="px-6 py-3">Valor Total</th>
                <th className="px-6 py-3 text-center">Parcelas</th>
                <th className="px-6 py-3 text-center">Início</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {transactions.map((t) => {
                const card = getCardInfo(t.cardId);
                const isExpanded = expandedId === t.id;
                const installmentValue = t.totalAmount / t.installments;

                return (
                  <React.Fragment key={t.id}>
                    <tr 
                      className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-700/20' : ''}`}
                      onClick={() => toggleExpand(t.id)}
                    >
                      <td className="pl-6 py-4">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{t.title}</td>
                      <td className="px-6 py-4">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: `${card.color}20`, color: card.color, border: `1px solid ${card.color}40` }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: card.color }} />
                          {card.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">{formatCurrency(t.totalAmount)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-slate-700 text-xs text-slate-200">
                          {t.installments}x
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {t.startMonth.split('-').reverse().join('/')}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(t)}
                            className="text-blue-400 hover:text-blue-300 transition p-1 hover:bg-blue-500/10 rounded"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemove(t.id)}
                            className="text-red-400 hover:text-red-300 transition p-1 hover:bg-red-500/10 rounded"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-slate-900/30 animate-in fade-in duration-200">
                        <td colSpan={7} className="px-6 py-4 border-b border-slate-700/50">
                          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                            <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Detalhamento das Parcelas
                              </span>
                              <span className="text-xs text-slate-500">
                                Valor da parcela: <span className="text-white font-mono">{formatCurrency(installmentValue)}</span>
                              </span>
                            </div>
                            
                            <div className="max-h-[300px] overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead className="text-xs text-slate-500 bg-slate-800/80 sticky top-0">
                                  <tr>
                                    <th className="px-4 py-2 text-left">#</th>
                                    <th className="px-4 py-2 text-left">Vencimento</th>
                                    <th className="px-4 py-2 text-left">Valor</th>
                                    <th className="px-4 py-2 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                  {Array.from({ length: t.installments }).map((_, index) => {
                                    const installmentDate = getInstallmentDate(t.startMonth, index, card.dueDay);
                                    const isPaid = isInstallmentPaid(t.cardId, installmentDate);
                                    const isPastDue = !isPaid && installmentDate < new Date();

                                    return (
                                      <tr key={index} className="hover:bg-slate-700/20">
                                        <td className="px-4 py-2 text-slate-400 w-12">
                                          {index + 1}/{t.installments}
                                        </td>
                                        <td className={`px-4 py-2 ${isPastDue ? 'text-red-400' : 'text-slate-300'}`}>
                                          {installmentDate.toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-2 text-slate-300 font-mono">
                                          {formatCurrency(installmentValue)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                          {isPaid ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20">
                                              <CheckCircle2 className="w-3 h-3" /> Pago
                                            </span>
                                          ) : (
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${isPastDue ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-slate-400 bg-slate-700/50 border-slate-600'}`}>
                                              <CircleDashed className="w-3 h-3" /> {isPastDue ? 'Atrasado' : 'Pendente'}
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionList;