"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/components/MainLayout';
import { Download, Search, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApprovalPaymentPage() {
  const { isDarkMode, userRole } = useAppContext();
  const router = useRouter();
  
  useEffect(() => {
    if (userRole !== 'atasan') {
      router.push('/backup-payment');
    }
  }, [userRole, router]);

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [paymentInput, setPaymentInput] = useState('');
  const [buktiBase64, setBuktiBase64] = useState('');
  const [buktiName, setBuktiName] = useState('');
  const [buktiMimeType, setBuktiMimeType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cachedData = localStorage.getItem('paymentRequestsCache');
    if (cachedData) {
      setRequests(JSON.parse(cachedData));
      setIsLoading(false);
    }

    const API_URL = "https://script.google.com/macros/s/AKfycbzCEjO2z3tnGwRtY4-zxLjrn-YEUh5pq7BKaDGOcJvPH3l8HxRaPdnU7uf0pm1giW0/exec";
    fetch(API_URL + '?sheetName=' + encodeURIComponent('backup & Payment'))
      .then(res => res.json())
      .then(data => {
        const reversedData = data.reverse();
        setRequests(reversedData);
        localStorage.setItem('paymentRequestsCache', JSON.stringify(reversedData));
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setBuktiBase64(event.target.result.toString());
          setBuktiName(file.name);
          setBuktiMimeType(file.type || 'image/jpeg');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePayment = async (req: any) => {
    if (!req.rowNumber) {
      alert("Sistem belum siap. Mohon refresh halaman ini.");
      return;
    }

    setIsSaving(true);
    try {
      const API_URL = "https://script.google.com/macros/s/AKfycbzCEjO2z3tnGwRtY4-zxLjrn-YEUh5pq7BKaDGOcJvPH3l8HxRaPdnU7uf0pm1giW0/exec";
      
      const payload: any = {
        action: 'updatePayment',
        rowNumber: req.rowNumber,
        payment: paymentInput
      };

      if (buktiBase64) {
        payload.buktiFile = {
          base64: buktiBase64,
          name: buktiName,
          mimeType: buktiMimeType
        };
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setRequests(prev => prev.map(item => item.rowNumber === req.rowNumber ? { 
          ...item, 
          Payment: paymentInput,
          'Bukti Pembayaran': result.buktiUrl || item['Bukti Pembayaran']
        } : item));
        setEditingRow(null);
        setPaymentInput('');
        setBuktiBase64('');
        setBuktiName('');
      } else {
        alert("Gagal menyimpan payment: " + result.message);
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const searchString = `${req['Nama Backup']} ${req['Nama Karyawan']} ${req['Cabang Ditempatkan']}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-emerald-600">Memuat data...</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent z-10 p-1">
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Approval Payment</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kelola pembayaran karyawan backup.</p>
        </div>
        <div className="flex items-center w-full sm:w-auto relative">
          <Search size={18} className={`absolute left-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Cari nama / cabang..."
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

      <div className="flex-1 overflow-auto rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="min-w-[1100px] w-full">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase sticky top-0 z-10 shadow-sm ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'
            }`}>
              <tr>
                <th className="px-6 py-4 rounded-tl-lg font-bold">Tgl Backup</th>
                <th className="px-6 py-4 font-bold">Karyawan (Pengganti)</th>
                <th className="px-6 py-4 font-bold">Cabang</th>
                <th className="px-6 py-4 font-bold">Bank & Rek</th>
                <th className="px-6 py-4 font-bold">Payment</th>
                <th className="px-6 py-4 font-bold">Bukti Pembayaran</th>
                <th className="px-6 py-4 rounded-tr-lg font-bold text-center w-40">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req, i) => (
                  <tr key={req.rowNumber || i} className={`border-b last:border-b-0 transition-colors ${
                    isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{req['Tanggal Backup']?.substring(0, 10)}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{req['Nama Backup']}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{req['Cabang Ditempatkan']}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#0c392c] dark:text-emerald-400">{req['Bank']}</div>
                      <div className="text-xs text-gray-500">{req['No Rekening']}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingRow === req.rowNumber ? (
                        <input
                          type="text"
                          value={paymentInput}
                          onChange={(e) => setPaymentInput(e.target.value)}
                          placeholder="Rp..."
                          className="w-full px-2 py-1 border rounded text-sm text-black"
                          autoFocus
                        />
                      ) : (
                        <div className="font-semibold">{req['Payment'] || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingRow === req.rowNumber ? (
                        <div className="flex flex-col gap-1">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded border"
                          >
                            <Upload size={14} /> {buktiName ? "Ganti Foto" : "Upload Foto"}
                          </button>
                          {buktiName && <span className="text-[10px] text-emerald-600 truncate w-24" title={buktiName}>{buktiName}</span>}
                        </div>
                      ) : (
                        req['Bukti Pembayaran'] ? (
                          <a href={req['Bukti Pembayaran']} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">Lihat Bukti</a>
                        ) : <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingRow === req.rowNumber ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSavePayment(req)}
                            disabled={isSaving}
                            className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded font-medium hover:bg-emerald-600 disabled:opacity-50"
                          >
                            {isSaving ? '...' : 'Simpan'}
                          </button>
                          <button
                            onClick={() => { setEditingRow(null); setBuktiName(''); setBuktiBase64(''); }}
                            disabled={isSaving}
                            className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium hover:bg-gray-300 disabled:opacity-50"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              setEditingRow(req.rowNumber);
                              setPaymentInput(req['Payment'] || '');
                            }}
                            className="flex items-center gap-1.5 text-xs bg-[#0c392c] text-white px-3 py-1.5 rounded-md font-medium hover:bg-[#082a20] transition-colors"
                          >
                            {req['Payment'] ? 'Edit' : 'Proses'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data payment ditemukan
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
