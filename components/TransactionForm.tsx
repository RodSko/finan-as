import React, { useState, useEffect } from 'react';
import { Transaction, Card } from '../types';
import { PlusCircle, CreditCard, Save, X } from 'lucide-react';

interface TransactionFormProps {
  cards: Card[];
  onAdd: (transaction: Transaction) => void;
  onUpdate: (transaction: Transaction) => void;
  onCancelEdit: () => void;
  editingTransaction: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  cards, 
  onAdd, 
  onUpdate,
  onCancelEdit,
  editingTransaction 
}) => {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [cardId, setCardId] = useState('');
  const [startMonth, setStartMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM
  });

  // Effect to populate form when editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      setTitle(editingTransaction.title);
      setTotalAmount(editingTransaction.totalAmount.toString());
      setInstallments(editingTransaction.installments.toString());
      setCardId(editingTransaction.cardId);
      setStartMonth(editingTransaction.startMonth);
    } else {
      resetForm();
    }
  }, [editingTransaction, cards]);

  // Select the first card automatically when available if none selected and not editing
  useEffect(() => {
    if (!editingTransaction && cards.length > 0 && !cardId) {
      setCardId(cards[0].id);
    }
  }, [cards, cardId, editingTransaction]);

  const resetForm = () => {
    setTitle('');
    setTotalAmount('');
    setInstallments('1');
    const now = new Date();
    setStartMonth(now.toISOString().slice(0, 7));
    if (cards.length > 0) setCardId(cards[0].id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !totalAmount || !startMonth || !cardId) return;

    const amount = parseFloat(totalAmount);
    const numInstallments = parseInt(installments, 10);

    if (isNaN(amount) || amount <= 0) return;
    if (isNaN(numInstallments) || numInstallments <= 0) return;

    if (editingTransaction) {
      // Update existing
      const updatedTransaction: Transaction = {
        ...editingTransaction,
        cardId,
        title,
        totalAmount: amount,
        installments: numInstallments,
        startMonth,
      };
      onUpdate(updatedTransaction);
    } else {
      // Create new
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        cardId,
        title,
        totalAmount: amount,
        installments: numInstallments,
        startMonth,
      };
      onAdd(newTransaction);
    }
    
    // Reset form is handled by the parent setting editingTransaction to null or manually here
    if (!editingTransaction) resetForm();
  };

  if (cards.length === 0) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg text-center">
        <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-white font-medium mb-2">Cadastre um cartão</h3>
        <p className="text-slate-400 text-sm">Adicione um cartão de crédito acima para começar a registrar suas compras.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border shadow-lg transition-colors ${editingTransaction ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}>
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        {editingTransaction ? (
          <>
            <Save className="w-5 h-5 text-indigo-400" />
            Editar Compra
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5 text-violet-400" />
            Nova Compra
          </>
        )}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
            placeholder="Ex: iPhone 15, Jantar..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Cartão Utilizado</label>
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
            required
          >
            {cards.map(card => (
              <option key={card.id} value={card.id}>{card.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Valor Total (R$)</label>
            <input
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Parcelas</label>
            <input
              type="number"
              min="1"
              max="48"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Mês da 1ª Parcela</label>
          <input
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
            required
          />
        </div>

        <div className="flex gap-3">
          {editingTransaction && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={`flex-1 font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
              editingTransaction 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {editingTransaction ? 'Atualizar' : 'Adicionar Despesa'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;