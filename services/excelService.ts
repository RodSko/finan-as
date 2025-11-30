import * as XLSX from 'xlsx';
import { Card, Transaction } from '../types';

export const excelService = {
  exportToExcel(
    cards: Card[], 
    transactions: Transaction[], 
    invoiceStatus: Record<string, boolean>
  ) {
    const wb = XLSX.utils.book_new();

    // 1. Cards Sheet
    const cardsData = cards.map(c => ({
      ID: c.id,
      Nome: c.name,
      Cor: c.color,
      DiaVencimento: c.dueDay
    }));
    const wsCards = XLSX.utils.json_to_sheet(cardsData);
    XLSX.utils.book_append_sheet(wb, wsCards, "Cartões");

    // 2. Transactions Sheet
    const transactionsData = transactions.map(t => ({
      ID: t.id,
      CardID: t.cardId,
      Descrição: t.title,
      ValorTotal: t.totalAmount,
      Parcelas: t.installments,
      Inicio: t.startMonth
    }));
    const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Transações");

    // 3. Payments Sheet
    // Convert record to array
    const paymentsData = Object.entries(invoiceStatus).map(([key, isPaid]) => {
      // key format: cardId-YYYY-MM
      const [cardId, year, month] = key.split('-');
      return {
        CardID: cardId,
        Mês: `${year}-${month}`,
        Pago: isPaid ? 'SIM' : 'NÃO'
      };
    });
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, wsPayments, "Pagamentos");

    // Download
    XLSX.writeFile(wb, `CreditFlow_Backup_${new Date().toISOString().slice(0,10)}.xlsx`);
  },

  async parseExcelFile(file: File): Promise<{ cards: any[], transactions: any[], payments: any[] } | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: 'binary' });

          // Parse Cards
          const wsCards = wb.Sheets["Cartões"];
          const cardsRaw = XLSX.utils.sheet_to_json(wsCards) as any[];
          const cards = cardsRaw.map(c => ({
            id: c.ID || crypto.randomUUID(),
            name: c.Nome,
            color: c.Cor,
            dueDay: parseInt(c.DiaVencimento) || 10
          }));

          // Parse Transactions
          const wsTrans = wb.Sheets["Transações"];
          const transRaw = XLSX.utils.sheet_to_json(wsTrans) as any[];
          const transactions = transRaw.map(t => ({
            id: t.ID || crypto.randomUUID(),
            cardId: t.CardID,
            title: t.Descrição,
            totalAmount: parseFloat(t.ValorTotal),
            installments: parseInt(t.Parcelas),
            startMonth: t.Inicio
          }));

          // Parse Payments
          const wsPay = wb.Sheets["Pagamentos"];
          const payRaw = wsPay ? XLSX.utils.sheet_to_json(wsPay) as any[] : [];
          const payments = payRaw.map(p => ({
            cardId: p.CardID,
            month: p.Mês,
            isPaid: p.Pago === 'SIM'
          }));

          resolve({ cards, transactions, payments });
        } catch (err) {
          console.error("Error parsing excel", err);
          resolve(null);
        }
      };
      reader.readAsBinaryString(file);
    });
  }
};