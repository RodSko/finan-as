export interface Card {
  id: string;
  name: string;
  color: string;
  dueDay: number; // Day of the month (1-31)
}

export interface Transaction {
  id: string;
  cardId: string;
  title: string;
  totalAmount: number;
  installments: number; // 1 for single payment
  startMonth: string; // Format: "YYYY-MM"
  category?: string;
}

export interface MonthlyData {
  month: string; // Format: "YYYY-MM"
  displayDate: string; // Format: "MMM/YY"
  totalDue: number;
  breakdown: Record<string, number>; // cardId -> amount
  items: Array<{
    title: string;
    installmentNumber: number;
    amount: number;
    cardId: string;
  }>;
}

export interface AIAdvice {
  summary: string;
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  tips: string[];
}