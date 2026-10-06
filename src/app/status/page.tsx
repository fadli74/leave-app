'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/components/MainLayout';
import { CheckCircle, XCircle, Clock, Search, Loader2, Download } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbzCEjO2z3tnGwRtY4-zxLjrn-YEUh5pq7BKaDGOcJvPH3l8HxRaPdnU7uf0pm1giW0/exec';

export default function StatusPage() {
  const { isDarkMode, startDate, endDate, searchQuery } = useAppContext();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const cachedData = localStorage.getItem('leaveRequestsCache');
    if (cachedData) {
      setRequests(JSON.parse(cachedData));
      setIsLoading(false);
    }

    fetch(API_URL + '?sheetName=' + encodeURIComponent('Form Cuti & Izin'))
      .then(res => res.json())
      .then(data => {
        const reversedData = data.reverse(); // Data terbaru di atas
        setRequests(reversedData);
        localStorage.setItem('leaveRequestsCache', JSON.stringify(reversedData));
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const filteredRequests = requests.filter(req => {
    let match = true;
    if (startDate && endDate) {
      const reqDate = new Date(req['Tanggal Mulai'] || req['Timestamp']);
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      if (reqDate < sDate || reqDate > eDate) match = false;
    }
    const q = (searchQuery || searchTerm).toLowerCase();
    if (q) {
      const matchSearch = (req['Nama Karyawan'] || '').toLowerCase().includes(q) ||
                          (req['Cabang Ditempatkan'] || '').toLowerCase().includes(q);
      if (!matchSearch) match = false;
    }
    return match;
  });  const handleExport = () => {
    let csv = 'TGL PENGAJUAN,NAMA KARYAWAN,CABANG,JENIS CUTI,TGL MULAI,TGL SELESAI,TOTAL HARI,APPROVER (ATASAN),STATUS\n';
    filteredRequests.forEach(req => {
      const tglPengajuan = req['Timestamp'] ? new Date(req['Timestamp']).toLocaleDateString('id-ID') : '-';
      const tglMulai = req['Tanggal Mulai'] ? new Date(req['Tanggal Mulai']).toLocaleDateString('id-ID') : '-';
      const tglSelesai = req['Tanggal Selesai'] ? new Date(req['Tanggal Selesai']).toLocaleDateString('id-ID') : '-';
      const status = req['Status'] || req.Status || 'Pending';
      const approver = ["approved", "disetujui", "rejected", "ditolak"].includes(status.toLowerCase().trim()) ? (req["Nama Atasan (Approver)"] || "-") : "-";
      csv += `"${tglPengajuan}","${req['Nama Karyawan'] || '-'}","${req['Cabang Ditempatkan'] || '-'}","${req['Jenis Cuti'] || '-'}","${tglMulai}","${tglSelesai}","${req['Total Hari'] || '-'}","${approver}","${status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Status_Pengajuan_Cuti.csv');
    a.click();
  };



  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className={`p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Status Pengajuan Cuti</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cek apakah pengajuan cuti Anda sudah disetujui atau belum.</p>
        </div>
        <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-[#0c392c] text-white hover:bg-[#082a20] transition-colors"
          >
            <Download size={18} /> Export CSV
          </button>
      </div>

      {/* Table of Status */}
      <div className={`flex-1 overflow-auto rounded-xl border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0c392c] animate-spin mb-2" />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Mengambil data terbaru...</p>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase border-b bg-[#0c392c] text-emerald-50 border-[#082a20]">
                <tr>
                  <th className="px-6 py-4 font-semibold">TGL PENGAJUAN</th>
                  <th className="px-6 py-4 font-semibold">NAMA KARYAWAN</th>
                  <th className="px-6 py-4 font-semibold">CABANG</th>
                  <th className="px-6 py-4 font-semibold">JENIS CUTI</th>
                  <th className="px-6 py-4 font-semibold">TGL MULAI</th>
                  <th className="px-6 py-4 font-semibold">TGL SELESAI</th>
                  <th className="px-6 py-4 font-semibold">TOTAL HARI</th>
                  <th className="px-6 py-4 font-semibold">APPROVER (ATASAN)</th>
                  <th className="px-6 py-4 font-semibold text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-100 dark:divide-gray-700 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {filteredRequests.map((req, idx) => (
                  <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req['Timestamp'] ? new Date(req['Timestamp']).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {req['Nama Karyawan'] || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {req['Cabang Ditempatkan'] || req['CABANG'] || '-'}
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
                    <td className="px-6 py-4 font-semibold text-center">
                      {req['Total Hari'] || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {["approved", "disetujui", "rejected", "ditolak"].includes((req["Status"] || req.Status || "").toLowerCase().trim()) ? (req["Nama Atasan (Approver)"] || "-") : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(req['Status'] || req.Status || '').toLowerCase() === 'approved' || (req['Status'] || req.Status || '').toLowerCase() === 'disetujui' ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 w-24">
                          Approved
                        </span>
                      ) : (req['Status'] || req.Status || '').toLowerCase() === 'rejected' || (req['Status'] || req.Status || '').toLowerCase() === 'ditolak' ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 w-24">
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 w-24">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada data pengajuan cuti yang ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}

