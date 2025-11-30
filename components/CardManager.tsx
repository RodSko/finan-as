import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { CreditCard, Plus, Trash2, Layers, Calendar, Pencil, Save, X } from 'lucide-react';

interface CardManagerProps {
  cards: Card[];
  onAdd: (card: Card) => void;
  onUpdate: (card: Card) => void;
  onRemove: (id: string) => void;
  selectedCardId: string | null;
  onSelectCard: (id: string | null) => void;
}

const COLORS = [
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Rosa', value: '#f43f5e' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Cinza', value: '#64748b' },
];

const CardManager: React.FC<CardManagerProps> = ({ 
  cards, 
  onAdd, 
  onUpdate,
  onRemove, 
  selectedCardId, 
  onSelectCard 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [dueDay, setDueDay] = useState('10');

  const resetForm = () => {
    setName('');
    setSelectedColor(COLORS[0].value);
    setDueDay('10');
    setEditingCardId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleEdit = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    setName(card.name);
    setSelectedColor(card.color);
    setDueDay(card.dueDay.toString());
    setEditingCardId(card.id);
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const day = parseInt(dueDay, 10);
    const validDay = isNaN(day) ? 10 : Math.min(31, Math.max(1, day));

    if (editingCardId) {
      // Update existing
      onUpdate({
        id: editingCardId,
        name,
        color: selectedColor,
        dueDay: validDay
      });
    } else {
      // Create new
      onAdd({
        id: crypto.randomUUID(),
        name,
        color: selectedColor,
        dueDay: validDay
      });
    }
    
    setIsOpen(false);
    resetForm();
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 sticky top-0 z-10">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-slate-400" />
          Meus Cartões
        </h3>
        <button
          onClick={isOpen ? handleCancel : handleOpenNew}
          className={`text-xs px-2 py-1 rounded transition flex items-center gap-1 ${isOpen ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          {isOpen ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isOpen ? 'Cancelar' : 'Novo'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900/50 border-b border-slate-700 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold uppercase text-indigo-400 tracking-wider">
                 {editingCardId ? 'Editar Cartão' : 'Novo Cartão'}
               </span>
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome do Cartão</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank, Visa Platinum..."
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs text-slate-400 mb-1">Dia Vencimento</label>
                 <div className="relative">
                   <Calendar className="w-4 h-4 text-slate-500 absolute left-2 top-2" />
                   <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 pl-8 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                 </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cor</label>
                <div className="flex gap-1 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        selectedColor === c.value ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="mt-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingCardId ? 'Salvar Alterações' : 'Criar Cartão'}
            </button>
          </div>
        </form>
      )}

      <div className="p-2 max-h-[300px] overflow-y-auto space-y-1">
        {/* Option: All Cards */}
        <div 
          onClick={() => onSelectCard(null)}
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition border ${
            selectedCardId === null 
              ? 'bg-slate-700/50 border-violet-500/50' 
              : 'hover:bg-slate-700/30 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedCardId === null ? 'bg-violet-500/20 text-violet-300' : 'bg-slate-700 text-slate-400'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-sm block ${selectedCardId === null ? 'text-white font-medium' : 'text-slate-300'}`}>Todos os Cartões</span>
              <span className="text-xs text-slate-500">Visão geral</span>
            </div>
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-4">Nenhum cartão cadastrado.</p>
        ) : (
          cards.map((card) => {
            const isSelected = selectedCardId === card.id;
            return (
              <div 
                key={card.id} 
                onClick={() => onSelectCard(card.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition border group ${
                  isSelected 
                    ? 'bg-slate-700/50 border-slate-600' 
                    : 'hover:bg-slate-700/30 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-xs font-bold text-white" 
                    style={{ backgroundColor: card.color }}
                  >
                    {card.dueDay}
                  </div>
                  <div>
                    <span className={`text-sm block ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                      {card.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      Vence dia {card.dueDay}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleEdit(card, e)}
                    className="text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition p-2 hover:bg-slate-700 rounded-full"
                    title="Editar cartão"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(card.id);
                    }}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-2 hover:bg-slate-700 rounded-full"
                    title="Remover cartão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CardManager;