import { supabase } from '../supabaseClient';
import { Card, Transaction } from '../types';

// Mappers to convert DB snake_case to App camelCase and vice-versa

export const dataService = {
  // --- CARDS ---
  async getCards(): Promise<Card[]> {
    const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      color: d.color,
      dueDay: d.due_day
    }));
  },

  async addCard(card: Card): Promise<Card | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.from('cards').insert({
      id: card.id,
      name: card.name,
      color: card.color,
      due_day: card.dueDay,
      user_id: user?.id // Attach user ID
    }).select().single();

    if (error) {
      console.error('Error adding card:', error);
      return null;
    }
    return card;
  },

  async updateCard(card: Card): Promise<boolean> {
    const { error } = await supabase.from('cards').update({
      name: card.name,
      color: card.color,
      due_day: card.dueDay
    }).eq('id', card.id);

    if (error) {
      console.error('Error updating card:', error);
      return false;
    }
    return true;
  },

  async deleteCard(id: string): Promise<boolean> {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) {
      console.error('Error deleting card:', error);
      return false;
    }
    return true;
  },

  // --- TRANSACTIONS ---
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data.map((d: any) => ({
      id: d.id,
      cardId: d.card_id,
      title: d.title,
      totalAmount: d.total_amount,
      installments: d.installments,
      startMonth: d.start_month
    }));
  },

  async addTransaction(t: Transaction): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('transactions').insert({
      id: t.id,
      card_id: t.cardId,
      title: t.title,
      total_amount: t.totalAmount,
      installments: t.installments,
      start_month: t.startMonth,
      user_id: user?.id // Attach user ID
    });

    if (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
    return true;
  },

  async updateTransaction(t: Transaction): Promise<boolean> {
    const { error } = await supabase.from('transactions').update({
      card_id: t.cardId,
      title: t.title,
      total_amount: t.totalAmount,
      installments: t.installments,
      start_month: t.startMonth
    }).eq('id', t.id);

    if (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
    return true;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
    return true;
  },

  // --- INVOICE PAYMENTS ---
  async getInvoicePayments(): Promise<Record<string, boolean>> {
    const { data, error } = await supabase.from('invoice_payments').select('*');
    if (error) {
      console.error('Error fetching invoice payments:', error);
      return {};
    }
    
    const statusMap: Record<string, boolean> = {};
    data.forEach((item: any) => {
      const key = `${item.card_id}-${item.month}`;
      statusMap[key] = item.is_paid;
    });
    return statusMap;
  },

  async toggleInvoiceStatus(cardId: string, month: string, isPaid: boolean): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('invoice_payments').upsert({
      card_id: cardId,
      month: month,
      is_paid: isPaid,
      user_id: user?.id // Attach user ID
    }, { onConflict: 'card_id,month' });

    if (error) {
      console.error('Error updating invoice status:', error);
      return false;
    }
    return true;
  },

  // --- BULK IMPORT ---
  async importData(data: { cards: any[], transactions: any[], payments: any[] }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      // 1. Upsert Cards
      if (data.cards.length > 0) {
        const dbCards = data.cards.map(c => ({
          id: c.id,
          name: c.name,
          color: c.color,
          due_day: c.dueDay,
          user_id: user.id
        }));
        const { error: cardError } = await supabase.from('cards').upsert(dbCards);
        if (cardError) throw cardError;
      }

      // 2. Upsert Transactions
      if (data.transactions.length > 0) {
        const dbTransactions = data.transactions.map(t => ({
          id: t.id,
          card_id: t.cardId,
          title: t.title,
          total_amount: t.totalAmount,
          installments: t.installments,
          start_month: t.startMonth,
          user_id: user.id
        }));
        const { error: transError } = await supabase.from('transactions').upsert(dbTransactions);
        if (transError) throw transError;
      }

      // 3. Upsert Payments
      if (data.payments.length > 0) {
        const dbPayments = data.payments.map(p => {
            return {
                card_id: p.cardId,
                month: p.month,
                is_paid: p.isPaid,
                user_id: user.id
            };
        });
        const { error: payError } = await supabase.from('invoice_payments').upsert(dbPayments, { onConflict: 'card_id,month' });
        if (payError) throw payError;
      }

      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
};