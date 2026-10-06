'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/components/MainLayout';
import { Download, Loader2, Search } from 'lucide-react';

export default function PaymentBackupPage() {
  const { isDarkMode, searchQuery, startDate, endDate } = useAppContext();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/1UyaqSC7BxG9wIEyVTHMnZU6dB---juCogG2pzAQL7XE/export?format=csv&gid=546180131');
        const csvText = await response.text();
        
        // Simple CSV parser
        const lines = csvText.split('\n');
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const parsedData = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            // Handle quotes in CSV
            let currentline = [];
            let inQuotes = false;
            let val = '';
            for (let j = 0; j < lines[i].length; j++) {
              let char = lines[i][j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                currentline.push(val.trim());
                val = '';
              } else {
                val += char;
              }
            }
            currentline.push(val.trim());
            
            const obj: any = {};
            for (let j = 0; j < headers.length; j++) {
              obj[headers[j]] = currentline[j] ? currentline[j].replace(/^"|"$/g, '') : '';
            }
            // Only add if there is actual data (e.g. Nama Backup is not empty)
            if (obj['Nama Backup'] || obj['Nama Karyawan']) {
              parsedData.push(obj);
            }
          }
          setData(parsedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Data_Payment_Backup.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredData = data.filter(item => {
    let matchSearch = true;
    let matchDate = true;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matchSearch = 
        (item['Nama Backup'] && item['Nama Backup'].toLowerCase().includes(q)) ||
        (item['Nama Karyawan'] && item['Nama Karyawan'].toLowerCase().includes(q)) ||
        (item['Cabang Ditempatkan'] && item['Cabang Ditempatkan'].toLowerCase().includes(q));
    }

    if (startDate && endDate && item['Tanggal Backup']) {
      // Date format from Google Sheets might vary, assuming DD/MM/YYYY or similar
      // We will try simple substring match or Date parse
      const itemDate = new Date(item['Tanggal Backup']);
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      if (!isNaN(itemDate.getTime())) {
        itemDate.setHours(0,0,0,0);
        sDate.setHours(0,0,0,0);
        eDate.setHours(23,59,59,999);
        matchDate = itemDate >= sDate && itemDate <= eDate;
      }
    }

    return matchSearch && matchDate;
  });

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent z-10 p-1">
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Payment Backup</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Data absensi dan pembayaran karyawan backup.</p>
        </div>
        <button 
          onClick={handleExport}
          className="items-center justify-center flex gap-2 bg-[#0c392c] hover:bg-[#082a20] text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className={`flex-1 overflow-auto rounded-xl border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0c392c] animate-spin mb-2" />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Mengambil data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase border-b bg-[#0c392c] text-emerald-50 border-[#082a20]">
                <tr>
                  <th className="px-6 py-4 font-semibold">TGL BACKUP</th>
                  <th className="px-6 py-4 font-semibold">NAMA BACKUP</th>
                  <th className="px-6 py-4 font-semibold">KARYAWAN CUTI</th>
                  <th className="px-6 py-4 font-semibold">CABANG</th>
                  <th className="px-6 py-4 font-semibold">BANK & REK</th>
                  <th className="px-6 py-4 font-semibold">FOTO MASUK</th>
                  <th className="px-6 py-4 font-semibold">FOTO PULANG</th>
                  <th className="px-6 py-4 font-semibold">BUKTI PEMBAYARAN</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-100 dark:divide-gray-700 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row['Tanggal Backup'] || '-'}
                      </td>
                      <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {row['Nama Backup'] || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {row['Nama Karyawan'] || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {row['Cabang Ditempatkan'] || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{row['Bank'] || '-'}</span>
                          <span className="text-xs opacity-80">{row['No Rekening'] || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {row['Foto Masuk'] ? (
                          <a href={row['Foto Masuk']} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Lihat Foto</a>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {row['Foto Pulang'] ? (
                          <a href={row['Foto Pulang']} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Lihat Foto</a>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {row['Payment'] || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
