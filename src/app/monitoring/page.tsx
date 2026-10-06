"use client";
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/components/MainLayout';
import { Search, CalendarDays } from 'lucide-react';

export default function MonitoringPage() {
  const { isDarkMode } = useAppContext();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const API_URL = "https://script.google.com/macros/s/AKfycbzCEjO2z3tnGwRtY4-zxLjrn-YEUh5pq7BKaDGOcJvPH3l8HxRaPdnU7uf0pm1giW0/exec";
    fetch(API_URL + '?sheetName=' + encodeURIComponent('Form Cuti & Izin'))
      .then(res => res.json())
      .then(data => {
        setRequests(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const h2 = new Date(today);
  h2.setDate(h2.getDate() + 2);

  const isOverlap = (startStr: string, endStr: string, targetDate: Date) => {
    if (!startStr || !endStr) return false;
    const start = new Date(startStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);
    return targetDate >= start && targetDate <= end;
  };

  const getMonitoringData = () => {
    const monitored: any[] = [];

    requests.forEach(req => {
      const start = req['Tanggal Mulai'];
      const end = req['Tanggal Selesai'];
      // Hanya tampilkan yang disetujui, tapi boleh saja tampilkan semua
      // Untuk amannya kita tampilkan semua agar tahu siapa saja yang sedang cuti/sakit
      
      const searchMatch = `${req['Nama Karyawan']} ${req['Cabang Ditempatkan']}`.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return;

      if (isOverlap(start, end, today)) {
        monitored.push({ ...req, _monitorType: 'today', _colorClass: isDarkMode ? 'bg-red-900/40 hover:bg-red-900/60 border-l-4 border-red-500' : 'bg-red-100 hover:bg-red-200 border-l-4 border-red-500' });
      } else if (isOverlap(start, end, tomorrow)) {
        monitored.push({ ...req, _monitorType: 'tomorrow', _colorClass: isDarkMode ? 'bg-yellow-900/40 hover:bg-yellow-900/60 border-l-4 border-yellow-500' : 'bg-yellow-100 hover:bg-yellow-200 border-l-4 border-yellow-500' });
      } else if (isOverlap(start, end, h2)) {
        monitored.push({ ...req, _monitorType: 'h2', _colorClass: isDarkMode ? 'bg-emerald-900/40 hover:bg-emerald-900/60 border-l-4 border-emerald-500' : 'bg-emerald-100 hover:bg-emerald-200 border-l-4 border-emerald-500' });
      }
    });

    // Sort by type: today -> tomorrow -> h2
    const order = { 'today': 1, 'tomorrow': 2, 'h2': 3 };
    monitored.sort((a, b) => order[a._monitorType as keyof typeof order] - order[b._monitorType as keyof typeof order]);

    return monitored;
  };

  const filteredData = getMonitoringData();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-emerald-600">Memuat data monitoring...</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent z-10 p-1">
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Monitoring Cuti & Sakit</h2>
          <div className="flex flex-wrap gap-3 mt-2 text-xs font-medium">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Hari Ini</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Besok (H+1)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Lusa (H+2)</span>
          </div>
        </div>
        <div className="flex items-center w-full sm:w-auto relative">
          <Search size={18} className={`absolute left-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Cari karyawan / cabang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full sm:w-64 pl-10 pr-4 py-2 rounded-md text-sm outline-none border focus:ring-2 focus:ring-[#0c392c] transition-all ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          />
        </div>
      </div>

      <div className={`flex-1 overflow-auto rounded-xl border shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="min-w-[900px] w-full">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase sticky top-0 z-10 shadow-sm ${
              isDarkMode ? 'bg-gray-700 text-gray-300 border-b border-gray-600' : 'bg-gray-50 text-gray-600 border-b border-gray-200'
            }`}>
              <tr>
                <th className="px-6 py-4 font-bold">KARYAWAN</th>
                <th className="px-6 py-4 font-bold">CABANG</th>
                <th className="px-6 py-4 font-bold">JENIS CUTI</th>
                <th className="px-6 py-4 font-bold">TGL MULAI</th>
                <th className="px-6 py-4 font-bold">TGL SELESAI</th>
                <th className="px-6 py-4 font-bold">KETERANGAN HARI</th>
                <th className="px-6 py-4 font-bold">BACKUP & TELP</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((req, i) => (
                  <tr key={i} className={`transition-colors border-b last:border-b-0 ${req._colorClass} ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                    <td className={`px-6 py-4 font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {req['Nama Karyawan'] || '-'}
                    </td>
                    <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {req['Cabang Ditempatkan'] || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req['Jenis Cuti/Izin'] || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req['Tanggal Mulai'] ? new Date(req['Tanggal Mulai']).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req['Tanggal Selesai'] ? new Date(req['Tanggal Selesai']).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold uppercase tracking-wider">
                      {req._monitorType === 'today' ? 'Hari Ini' : (req._monitorType === 'tomorrow' ? 'Besok (H+1)' : 'Lusa (H+2)')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{req['Nama Backup'] || '-'}</div>
                      <div className="text-xs opacity-80">{req['No Telp'] || '-'}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={`px-6 py-12 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <CalendarDays className="mx-auto h-12 w-12 opacity-20 mb-3" />
                    <p>Tidak ada karyawan yang cuti/sakit pada hari ini, besok, atau lusa.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
