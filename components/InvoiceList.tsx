import React, { useState, useEffect } from 'react';
import { MonthlyData, Card } from '../types';
import { CheckCircle, Circle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface InvoiceListProps {
  monthlyData: MonthlyData[];
  cards: Card[];
  invoiceStatus: Record<string, boolean>; // key format: "cardId-YYYY-MM"
  onToggleStatus: (key: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ 
  monthlyData, 
  cards, 
  invoiceStatus, 
  onToggleStatus 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusKey = (cardId: string, month: string) => `${cardId}-${month}`;

  const getDueDate = (monthStr: string, day: number) => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDaysRemaining = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dueDate);
    target.setHours(0,0,0,0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Venceu há ${Math.abs(diffDays)} dias`;
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays === 1) return 'Vence amanhã';
    return `Vence em ${diffDays} dias`;
  };

  // Helper to render a single invoice row
  const renderInvoiceRow = (data: MonthlyData, card: Card) => {
    const amount = data.breakdown[card.id];
    const statusKey = getStatusKey(card.id, data.month);
    const isPaid = invoiceStatus[statusKey] || false;
    const dueDate = getDueDate(data.month, card.dueDay);
    const isPastDue = !isPaid && dueDate < new Date() && getDaysRemaining(dueDate).includes('Venceu');

    return (
      <div 
        key={`${data.month}-${card.id}`}
        className={`
          flex items-center justify-between p-3 rounded-lg border transition-all duration-200 mb-2 last:mb-0
          ${isPaid 
            ? 'bg-emerald-900/10 border-emerald-500/30 opacity-70' 
            : isPastDue 
              ? 'bg-red-900/10 border-red-500/50' 
              : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
          }
        `}
        onClick={(e) => e.stopPropagation()} // Prevent toggling accordion when clicking the row
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => onToggleStatus(statusKey)}
            className={`
              flex-shrink-0 transition-colors duration-200
              ${isPaid ? 'text-emerald-500 hover:text-emerald-400' : 'text-slate-600 hover:text-slate-400'}
            `}
            title={isPaid ? "Marcar como pendente" : "Marcar como pago"}
          >
            {isPaid ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: card.color }}
              />
              <span className={`font-medium ${isPaid ? 'text-slate-400 line-through' : 'text-white'}`}>
                {card.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <span className={`text-xs ${isPastDue ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                 {card.dueDay}/{data.month.split('-')[1]} - {isPaid ? 'Pago' : getDaysRemaining(dueDate)}
               </span>
            </div>
          </div>
        </div>

        <div className="text-right">
           <div className={`font-bold font-mono ${isPaid ? 'text-slate-500' : 'text-white'}`}>
             {formatCurrency(amount)}
           </div>
        </div>
      </div>
    );
  };

  // Find all invoices
  const allInvoices: { data: MonthlyData; card: Card }[] = [];
  monthlyData.forEach(data => {
    const activeCards = cards.filter(card => (data.breakdown[card.id] || 0) > 0);
    activeCards.forEach(card => {
      allInvoices.push({ data, card });
    });
  });

  // Calculate default invoice (Current or Future)
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // "YYYY-MM"
  const upcomingInvoice = allInvoices.find(inv => inv.data.month >= currentMonthStr);
  const defaultInvoice = upcomingInvoice || allInvoices[allInvoices.length - 1];

  // Auto-scroll effect
  useEffect(() => {
    if (isExpanded && defaultInvoice) {
      // Small timeout to wait for the DOM to render/expand
      const timer = setTimeout(() => {
        const element = document.getElementById(`invoice-month-${defaultInvoice.data.month}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, defaultInvoice]);

  if (allInvoices.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden transition-all duration-300">
      <div 
        className="p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-750 flex justify-between items-center bg-slate-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Gestão de Faturas
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isExpanded 
              ? 'Visualizando todas as faturas' 
              : `Destaque: ${defaultInvoice.card.name} (${defaultInvoice.data.displayDate})`
            }
          </p>
        </div>
        <div className="text-slate-400 bg-slate-700/50 p-1.5 rounded-lg">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-100'}`}>
        {!isExpanded ? (
          <div className="p-4 bg-slate-800/50">
            {/* Collapsed View: Show the calculated default invoice */}
             <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
               {defaultInvoice.data.displayDate}
             </div>
             {renderInvoiceRow(defaultInvoice.data, defaultInvoice.card)}
             
             <div 
               onClick={(e) => {
                 e.stopPropagation(); 
                 setIsExpanded(true);
               }}
               className="mt-3 text-center text-xs text-slate-500 hover:text-indigo-400 cursor-pointer flex items-center justify-center gap-1 py-2 border-t border-slate-700/50"
             >
               Ver histórico completo <ChevronDown className="w-3 h-3" />
             </div>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
             <div className="divide-y divide-slate-700">
              {monthlyData.map((data) => {
                const activeCardsInMonth = cards.filter(card => (data.breakdown[card.id] || 0) > 0);
                if (activeCardsInMonth.length === 0) return null;

                return (
                  <div 
                    key={data.month} 
                    id={`invoice-month-${data.month}`} // ID used for auto-scrolling
                    className="p-4 bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-slate-800/95 p-2 -mx-2 rounded-lg backdrop-blur-sm z-10 border border-slate-700/50 shadow-sm">
                       <div className="bg-slate-700 text-slate-200 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                         {data.displayDate}
                       </div>
                       <div className="h-px bg-slate-700 flex-1 opacity-50"></div>
                       <div className="text-slate-400 text-xs font-mono">
                         Total: {formatCurrency(data.totalDue)}
                       </div>
                    </div>

                    <div className="grid gap-2">
                      {activeCardsInMonth.map(card => renderInvoiceRow(data, card))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div 
                onClick={() => setIsExpanded(false)}
                className="p-3 text-center text-xs text-slate-500 hover:text-indigo-400 cursor-pointer border-t border-slate-700 bg-slate-800 sticky bottom-0"
              >
                <span className="flex items-center justify-center gap-1">
                  Recolher lista <ChevronUp className="w-3 h-3" />
                </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;