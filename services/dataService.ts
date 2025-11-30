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
    // We assume ID is generated client-side for optimistic UI, or we can omit it to let DB gen it.
    // Here we use the passed ID to keep UI consistent.
    const { data, error } = await supabase.from('cards').insert({
      id: card.id,
      name: card.name,
      color: card.color,
      due_day: card.dueDay
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
    const { error } = await supabase.from('transactions').insert({
      id: t.id,
      card_id: t.cardId,
      title: t.title,
      total_amount: t.totalAmount,
      installments: t.installments,
      start_month: t.startMonth
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
      // Key format must match what App.tsx expects: "cardId-YYYY-MM"
      const key = `${item.card_id}-${item.month}`;
      statusMap[key] = item.is_paid;
    });
    return statusMap;
  },

  async toggleInvoiceStatus(cardId: string, month: string, isPaid: boolean): Promise<boolean> {
    // Upsert: if exists update, if not insert
    const { error } = await supabase.from('invoice_payments').upsert({
      card_id: cardId,
      month: month,
      is_paid: isPaid
    }, { onConflict: 'card_id, month' });

    if (error) {
      console.error('Error updating invoice status:', error);
      return false;
    }
    return true;
  }
};