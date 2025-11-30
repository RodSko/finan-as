import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { MonthlyData, Card } from '../types';

interface DebtChartProps {
  data: MonthlyData[];
  cards: Card[];
  onCardSelect?: (cardId: string) => void;
}

const DebtChart: React.FC<DebtChartProps> = ({ data, cards, onCardSelect }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for Recharts: flatten the breakdown object into the main object
  const chartData = data.map(d => ({
    ...d,
    ...d.breakdown, // spreads { cardId1: 100, cardId2: 200 } into the object
  }));

  const handleCardClick = (dataKey: string) => {
    // Only trigger if the clicked key corresponds to a valid card ID (not "Total" or other keys)
    if (onCardSelect && cards.some(c => c.id === dataKey)) {
      onCardSelect(dataKey);
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-slate-800 rounded-xl border border-slate-700 text-slate-400">
        Nenhum dado para exibir no gráfico.
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Evolução da Fatura</h3>
        <p className="text-xs text-slate-400">Clique em um cartão na legenda ou no gráfico para filtrar.</p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              {cards.map((card) => (
                <linearGradient key={card.id} id={`color-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={card.color} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={card.color} stopOpacity={0.1}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickFormatter={(value) => `R$${value}`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
              itemStyle={{ color: '#c4b5fd' }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              formatter={(value: number, name: string) => {
                 // Find card name if key is ID, otherwise fallback
                 const card = cards.find(c => c.id === name);
                 const label = card ? card.name : (name === 'totalDue' || name === 'Total' ? 'Total Geral' : name);
                 return [formatCurrency(value), label];
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              formatter={(value) => {
                 const card = cards.find(c => c.id === value);
                 return <span style={{ color: '#cbd5e1', marginRight: 10, cursor: 'pointer' }}>{card ? card.name : value}</span>;
              }}
              onClick={(e) => handleCardClick(e.dataKey as string)}
              wrapperStyle={{ cursor: 'pointer' }}
            />
            
            {/* 1. Stacked Areas (Background Volume) */}
            {cards.map((card) => (
              <Area 
                key={`area-${card.id}`}
                type="monotone" 
                dataKey={card.id} 
                name={card.id} 
                stackId="1" 
                stroke="none"
                fill={`url(#color-${card.id})`} 
                fillOpacity={0.6}
                activeDot={false}
                animationDuration={1500}
                onClick={() => handleCardClick(card.id)}
                cursor="pointer"
              />
            ))}

            {/* 2. Individual Lines (Trends) - Rendered on top */}
            {cards.map((card) => (
              <Line
                key={`line-${card.id}`}
                type="monotone"
                dataKey={card.id}
                stroke={card.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                legendType="none" // Hide from legend to avoid duplicates
                animationDuration={2000}
                strokeOpacity={0.8}
                onClick={() => handleCardClick(card.id)}
                cursor="pointer"
              />
            ))}

            {/* 3. Total Trend Line */}
            <Line
              type="monotone"
              dataKey="totalDue"
              name="Total"
              stroke="#f8fafc"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: '#f8fafc', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={2500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DebtChart;