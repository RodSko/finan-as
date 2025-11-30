import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { Card, Transaction } from '../types';
import { excelService } from '../services/excelService';
import { dataService } from '../services/dataService';

interface DataControlsProps {
  cards: Card[];
  transactions: Transaction[];
  invoiceStatus: Record<string, boolean>;
  onDataImported: () => void;
}

const DataControls: React.FC<DataControlsProps> = ({ 
  cards, 
  transactions, 
  invoiceStatus,
  onDataImported 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    excelService.exportToExcel(cards, transactions, invoiceStatus);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const parsedData = await excelService.parseExcelFile(file);
      if (parsedData) {
        const success = await dataService.importData(parsedData);
        if (success) {
          alert('Dados importados com sucesso!');
          onDataImported(); // Reload app data
        } else {
          alert('Erro ao salvar dados no banco de dados.');
        }
      } else {
        alert('Erro ao ler o arquivo Excel.');
      }
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro na importação.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
        title="Baixar planilha Excel com todos os dados"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar Excel</span>
      </button>

      <div className="relative">
        <input
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          title="Importar dados de planilha Excel"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span className="hidden sm:inline">{importing ? 'Importando...' : 'Importar Excel'}</span>
        </button>
      </div>
    </div>
  );
};

export default DataControls;