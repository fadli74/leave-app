'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/components/MainLayout';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Search, Loader2, Download } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbwMTwTLCd0x_lhdnj9QqPLUUKxoR__NwnIuL3Ml1Rfy9yS6-Tz6wPBxQScxovXy_PAWlQ/exec';

export default function ApprovalPage() {
  const { isDarkMode, loggedInName, userRole, startDate, endDate, searchQuery } = useAppContext();
  const router = useRouter();
  useEffect(() => {
    if (userRole !== 'atasan') {
      router.push('/form-cuti-sakit');
    }
  }, [userRole, router]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Contoh fungsi untuk mensimulasikan ambil data pengajuan cuti
  useEffect(() => {
    // 1. Tampilkan data dari memori (cache) terlebih dahulu agar instan
    const cachedData = localStorage.getItem('leaveRequestsCache');
    if (cachedData) {
      setRequests(JSON.parse(cachedData));
      setIsLoading(false);
    }

    // 2. Ambil data terbaru secara diam-diam di latar belakang
    fetch(API_URL + '?sheetName=' + encodeURIComponent('Form Cuti & Izin'))
      .then(res => res.json())
      .then(data => {
        const reversedData = data.reverse();
        setRequests(reversedData);
        localStorage.setItem('leaveRequestsCache', JSON.stringify(reversedData));
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const updateStatus = async (req: any, status: string) => {
    // Jika tidak ada rowNumber, berarti script Google belum diperbarui
    if (!req.rowNumber) {
      alert("Script Google perlu diperbarui terlebih dahulu agar sistem tahu baris mana yang harus diupdate.");
      return;
    }

    try {
      // Optimistic UI update (ubah status di layar langsung tanpa loading lama)
      setRequests(prev => prev.map(item => item.rowNumber === req.rowNumber ? { ...item, Status: status, 'Nama Atasan (Approver)': loggedInName } : item));

      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          sheetName: 'Form Cuti & Izin',
          action: 'updateStatus',
          rowNumber: req.rowNumber,
          status: status, approverName: loggedInName }) });
      
      const result = await response.json();
      if (result.status !== 'success') {
        alert("Gagal mengupdate status: " + result.message);
        // Revert UI jika gagal (opsional)
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Terjadi kesalahan jaringan saat mengupdate status.");
    }
  };

  const handleApprove = (req: any) => {
    updateStatus(req, 'Approved');
  };

  const handleReject = (req: any) => {
    if (confirm(`Apakah Anda yakin ingin menolak cuti dari ${req['Nama Karyawan']}?`)) {
      updateStatus(req, 'Rejected');
    }
  };

  const filteredRequests = requests.filter(req => {
    const s = (req['Status'] || req.Status || '').toLowerCase().trim();
    const isPending = !['approved', 'disetujui', 'rejected', 'ditolak'].includes(s);
    
    let matchDate = true;
    if (startDate && endDate) {
      const reqDate = new Date(req['Tanggal Mulai'] || req['Timestamp']);
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      if (reqDate < sDate || reqDate > eDate) matchDate = false;
    }

    const q = (searchQuery || searchTerm).toLowerCase();
    const matchSearch = (req['Nama Karyawan'] || '').toLowerCase().includes(q) ||
                        (req['Cabang Ditempatkan'] || '').toLowerCase().includes(q);
                        
    return isPending && matchDate && (q ? matchSearch : true);
  });  const handleExport = () => {
    let csv = 'TGL PENGAJUAN,NAMA KARYAWAN,CABANG,JENIS CUTI,TGL MULAI,TGL SELESAI,APPROVER (ATASAN),STATUS\n';
    filteredRequests.forEach(req => {
      const tglPengajuan = req['Timestamp'] ? new Date(req['Timestamp']).toLocaleDateString('id-ID') : '-';
      const tglMulai = req['Tanggal Mulai'] ? new Date(req['Tanggal Mulai']).toLocaleDateString('id-ID') : '-';
      const tglSelesai = req['Tanggal Selesai'] ? new Date(req['Tanggal Selesai']).toLocaleDateString('id-ID') : '-';
      const status = req['Status'] || req.Status || 'Pending';
      const approver = req["Nama Atasan (Approver)"] || "-";
      csv += `"${tglPengajuan}","${req['Nama Karyawan'] || '-'}","${req['Cabang Ditempatkan'] || '-'}","${req['Jenis Cuti'] || '-'}","${tglMulai}","${tglSelesai}","${approver}","${status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Data_Approval_Cuti.csv');
    a.click();
  };



  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className={`p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Persetujuan Cuti (Approval)</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daftar pengajuan cuti karyawan yang menunggu persetujuan Anda.</p>
        </div>
        <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-[#0c392c] text-white hover:bg-[#082a20] transition-colors"
          >
            <Download size={18} /> Export CSV
          </button>
      </div>

      {/* Table of Requests */}
      <div className={`flex-1 overflow-auto rounded-xl border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0c392c] animate-spin mb-2" />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Mengambil data pengajuan cuti...</p>
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
                  <th className="px-6 py-4 font-semibold">APPROVER (ATASAN)</th>
                  <th className="px-6 py-4 font-semibold text-center">STATUS</th>
                  <th className="px-6 py-4 font-semibold text-center">AKSI</th>
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
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        {req.Status === 'Approved' || req.Status === 'Rejected' ? (
                          <span className="text-xs text-gray-400 italic">Telah Diproses</span>
                        ) : (
                          <>
                            <button onClick={() => handleApprove(req)} className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-md transition-colors" title="Approve">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleReject(req)} className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors" title="Reject">
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada data pengajuan cuti yang masuk.</p>
          </div>
        )}
      </div>
    </div>
  );
}


