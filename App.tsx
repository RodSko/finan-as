import React, { useState, useMemo, useEffect } from 'react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import DebtChart from './components/DebtChart';
import AIAdvisor from './components/AIAdvisor';
import CardManager from './components/CardManager';
import InvoiceList from './components/InvoiceList';
import { Transaction, MonthlyData, Card } from './types';
import { Wallet, FilterX, Loader2 } from 'lucide-react';
import { dataService } from './services/dataService';

// Helper to add months to a date string "YYYY-MM"
const addMonths = (dateStr: string, months: number): string => {
  const [year, month] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return date.toISOString().slice(0, 7);
};

// Helper to format date string "YYYY-MM" to "MMM/YY"
const formatDisplayDate = (dateStr: string): string => {
  const [year, month] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Selection state for filtering
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Status of invoices: Key = "cardId-YYYY-MM", Value = true (paid)
  const [invoiceStatus, setInvoiceStatus] = useState<Record<string, boolean>>({});

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fetchedCards, fetchedTransactions, fetchedStatus] = await Promise.all([
          dataService.getCards(),
          dataService.getTransactions(),
          dataService.getInvoicePayments()
        ]);
        
        setCards(fetchedCards);
        setTransactions(fetchedTransactions);
        setInvoiceStatus(fetchedStatus);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleInvoiceStatus = async (key: string) => {
    // key format: "cardId-YYYY-MM"
    const [cardId, year, month] = key.split('-');
    const monthStr = `${year}-${month}`;
    const newValue = !invoiceStatus[key];

    // Optimistic Update
    setInvoiceStatus(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Persist
    await dataService.toggleInvoiceStatus(cardId, monthStr, newValue);
  };

  // Filter transactions based on selection
  const filteredTransactions = useMemo(() => {
    return selectedCardId 
      ? transactions.filter(t => t.cardId === selectedCardId) 
      : transactions;
  }, [transactions, selectedCardId]);

  // Calculate monthly totals based on FILTERED transactions
  const monthlyData = useMemo<MonthlyData[]>(() => {
    if (filteredTransactions.length === 0) return [];

    const dataMap = new Map<string, MonthlyData>();
    let minDate = '9999-12';
    let maxDate = '0000-00';

    // 1. Process filtered transactions
    filteredTransactions.forEach((t) => {
      const amountPerInstallment = t.totalAmount / t.installments;

      for (let i = 0; i < t.installments; i++) {
        const currentMonth = addMonths(t.startMonth, i);
        
        if (currentMonth < minDate) minDate = currentMonth;
        if (currentMonth > maxDate) maxDate = currentMonth;

        const existing = dataMap.get(currentMonth) || {
          month: currentMonth,
          displayDate: formatDisplayDate(currentMonth),
          totalDue: 0,
          breakdown: {},
          items: []
        };

        existing.totalDue += amountPerInstallment;
        
        // Add to card breakdown
        existing.breakdown[t.cardId] = (existing.breakdown[t.cardId] || 0) + amountPerInstallment;

        existing.items.push({
          title: t.title,
          installmentNumber: i + 1,
          amount: amountPerInstallment,
          cardId: t.cardId
        });

        dataMap.set(currentMonth, existing);
      }
    });

    // 2. Fill in gaps
    const result: MonthlyData[] = [];
    if (minDate !== '9999-12' && maxDate !== '0000-00') {
        let iterDate = minDate;
        while (iterDate <= maxDate) {
            const data = dataMap.get(iterDate);
            if (data) {
                // Round totals for clean display
                data.totalDue = Math.round(data.totalDue * 100) / 100;
                // Round breakdowns
                Object.keys(data.breakdown).forEach(key => {
                    data.breakdown[key] = Math.round(data.breakdown[key] * 100) / 100;
                });
                result.push(data);
            } else {
                result.push({
                    month: iterDate,
                    displayDate: formatDisplayDate(iterDate),
                    totalDue: 0,
                    breakdown: {},
                    items: []
                });
            }
            iterDate = addMonths(iterDate, 1);
        }
    }

    return result.sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  // Filter cards passed to charts/lists.
  const visibleCards = useMemo(() => {
    if (selectedCardId) {
      return cards.filter(c => c.id === selectedCardId);
    }

    const activeCardIds = new Set<string>();
    monthlyData.forEach(data => {
      Object.entries(data.breakdown).forEach(([id, amount]) => {
        if (amount > 0) activeCardIds.add(id);
      });
    });

    if (monthlyData.length === 0) return cards;

    return cards.filter(c => activeCardIds.has(c.id));
  }, [cards, selectedCardId, monthlyData]);

  // Calculate Dashboard Metrics considering Paid Status
  const dashboardMetrics = useMemo(() => {
    let totalRemaining = 0;
    let monthsWithDebt = 0;

    monthlyData.forEach((data) => {
      let isMonthFullyPaid = true;
      let monthHasDebtContent = false; 

      Object.entries(data.breakdown).forEach(([cardId, amount]) => {
        if (amount > 0) {
          monthHasDebtContent = true;
          const key = `${cardId}-${data.month}`;
          const isPaid = invoiceStatus[key];

          if (!isPaid) {
            totalRemaining += amount;
            isMonthFullyPaid = false;
          }
        }
      });

      if (monthHasDebtContent && !isMonthFullyPaid) {
        monthsWithDebt++;
      }
    });

    return { totalRemaining, monthsWithDebt };
  }, [monthlyData, invoiceStatus]);

  // --- HANDLERS (With Persistence) ---

  const addTransaction = async (t: Transaction) => {
    setTransactions((prev) => [...prev, t]); // Optimistic
    await dataService.addTransaction(t);
  };

  const updateTransaction = async (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTransaction(null);
    await dataService.updateTransaction(updated);
  };

  const removeTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (editingTransaction && editingTransaction.id === id) {
      setEditingTransaction(null);
    }
    await dataService.deleteTransaction(id);
  };

  const startEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
  };

  const addCard = async (c: Card) => {
    setCards(prev => [...prev, c]);
    await dataService.addCard(c);
  };

  const updateCard = async (updated: Card) => {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    await dataService.updateCard(updated);
  };

  const removeCard = async (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (selectedCardId === id) setSelectedCardId(null);
    await dataService.deleteCard(id);
  };
  
  const selectedDetails = useMemo(() => cards.find(c => c.id === selectedCardId), [cards, selectedCardId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-indigo-400">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="text-slate-400 text-sm">Carregando suas finanças...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">CreditFlow</h1>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">
            Controle de Cartões Inteligente
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs & Managers */}
          <div className="lg:col-span-4 space-y-6">
            <CardManager 
              cards={cards} 
              onAdd={addCard} 
              onUpdate={updateCard}
              onRemove={removeCard}
              selectedCardId={selectedCardId}
              onSelectCard={setSelectedCardId}
            />
            
            <TransactionForm 
              cards={cards} 
              onAdd={addTransaction} 
              onUpdate={updateTransaction}
              onCancelEdit={cancelEdit}
              editingTransaction={editingTransaction}
            />
            
            <AIAdvisor data={monthlyData} />
          </div>

          {/* Right Column: Chart & List */}
          <div className="lg:col-span-8 space-y-6">
            
            {selectedCardId && (
              <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-10 rounded-full" style={{ backgroundColor: selectedDetails?.color }}></div>
                  <div>
                    <h2 className="text-white font-semibold">Filtrado por: {selectedDetails?.name}</h2>
                    <p className="text-indigo-300 text-xs">Exibindo apenas débitos deste cartão</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCardId(null)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
                >
                  <FilterX className="w-4 h-4" />
                  Limpar Filtro
                </button>
              </div>
            )}

            <DebtChart data={monthlyData} cards={visibleCards} />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition">
                      <Wallet size={48} />
                    </div>
                    <p className="text-slate-400 text-sm">Total Comprometido</p>
                    <p className="text-2xl font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            dashboardMetrics.totalRemaining
                        )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Em parcelas não pagas
                    </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm">Pico da Fatura</p>
                    <p className="text-2xl font-bold text-violet-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            Math.max(...monthlyData.map(d => d.totalDue), 0)
                        )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Maior valor mensal
                    </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm">Meses Restantes</p>
                    <p className="text-2xl font-bold text-emerald-400">
                        {dashboardMetrics.monthsWithDebt}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Até quitar todas as dívidas
                    </p>
                </div>
            </div>

            <InvoiceList 
              monthlyData={monthlyData} 
              cards={cards}
              invoiceStatus={invoiceStatus}
              onToggleStatus={toggleInvoiceStatus}
            />

            <TransactionList 
              transactions={filteredTransactions} 
              cards={cards} 
              invoiceStatus={invoiceStatus}
              onRemove={removeTransaction}
              onEdit={startEditTransaction}
            />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;