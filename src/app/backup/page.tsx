'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/components/MainLayout';
import { CheckCircle, XCircle, Clock, Search, Loader2, Pencil, Trash2, Download } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbzCEjO2z3tnGwRtY4-zxLjrn-YEUh5pq7BKaDGOcJvPH3l8HxRaPdnU7uf0pm1giW0/exec';

export default function BackupPage() {
  const { isDarkMode, userRole, startDate, endDate, searchQuery } = useAppContext();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editForm, setEditForm] = useState({ namaBackup: '', noTelp: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cachedData = localStorage.getItem('leaveRequestsCache');
    if (cachedData) {
      setRequests(JSON.parse(cachedData));
      setIsLoading(false);
    }

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

  const handleEditClick = (req: any) => {
    if (!req.rowNumber) {
      alert("Error: rowNumber tidak ditemukan. Pastikan Google Apps Script Anda sudah mengembalikan rowNumber.");
      return;
    }
    setEditingRequest(req);
    setEditForm({
      namaBackup: req['Nama Backup'] || '',
      noTelp: req['No Telp / HP'] || req['No Telp'] || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        action: 'editBackup',
        sheetName: 'Form Cuti & Izin',
        rowNumber: editingRequest.rowNumber,
        namaBackup: editForm.namaBackup,
        noTelp: editForm.noTelp
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        // Update UI secara optimis
        const updatedRequests = requests.map(r => 
          r.rowNumber === editingRequest.rowNumber 
            ? { ...r, 'Nama Backup': editForm.namaBackup, 'No Telp / HP': editForm.noTelp }
            : r
        );
        setRequests(updatedRequests);
        localStorage.setItem('leaveRequestsCache', JSON.stringify(updatedRequests));
        alert('Data Backup berhasil diperbarui!');
        setIsEditModalOpen(false);
      } else {
        alert('Gagal memperbarui data. Pastikan Google Apps Script sudah diperbarui.');
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan.');
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = async (req: any) => {
    if (!req.rowNumber) {
      alert("Error: rowNumber tidak ditemukan.");
      return;
    }
    
    if (confirm(`Apakah Anda yakin ingin menghapus data backup untuk ${req['Nama Karyawan']}?`)) {
      try {
        const payload = {
          action: 'editBackup', // Hapus sama dengan mengosongkan field
          sheetName: 'Form Cuti & Izin',
          rowNumber: req.rowNumber,
          namaBackup: '',
          noTelp: ''
        };

        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.status === 'success') {
          const updatedRequests = requests.map(r => 
            r.rowNumber === req.rowNumber 
              ? { ...r, 'Nama Backup': '', 'No Telp / HP': '' }
              : r
          );
          setRequests(updatedRequests);
          localStorage.setItem('leaveRequestsCache', JSON.stringify(updatedRequests));
          alert('Data Backup berhasil dihapus!');
        } else {
          alert('Gagal menghapus data.');
        }
      } catch (error) {
        alert('Terjadi kesalahan jaringan.');
      }
    }
  };

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
                          (req['Nama Backup'] || '').toLowerCase().includes(q);
      if (!matchSearch) match = false;
    }
    return match;
  });

  const handleExport = () => {
    let csv = 'TGL PENGAJUAN,NAMA KARYAWAN,CABANG,JENIS CUTI,NAMA BACKUP,NO. TELP,TGL MULAI,TGL SELESAI\n';
    filteredRequests.forEach(req => {
      const tgl = req['Timestamp'] ? new Date(req['Timestamp']).toLocaleDateString('id-ID') : '-';
      csv += `"${tgl}","${req['Nama Karyawan'] || '-'}","${req['Cabang Ditempatkan'] || '-'}","${req['Jenis Cuti'] || '-'}","${req['Nama Backup'] || '-'}","${req['No Telepon Backup'] || '-'}","${req['Tanggal Mulai'] ? new Date(req['Tanggal Mulai']).toLocaleDateString('id-ID') : '-'}","${req['Tanggal Selesai'] ? new Date(req['Tanggal Selesai']).toLocaleDateString('id-ID') : '-'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Data_Backup_Karyawan.csv');
    a.click();
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className={`p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Daftar Backup Karyawan</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lihat siapa yang menggantikan (mem-backup) posisi karyawan yang sedang cuti.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExport}
              className="flex-1 sm:flex-none items-center justify-center flex gap-2 bg-[#0c392c] hover:bg-[#082a20] text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            <div className="relative flex-1 sm:w-64 hidden">
            </div>
          </div>
      </div>

      {/* Table of Backups */}
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
                  <th className="px-6 py-4 font-semibold">KARYAWAN CUTI</th>
                  <th className="px-6 py-4 font-semibold">CABANG</th>
                  <th className="px-6 py-4 font-semibold">NAMA BACKUP</th>
                  <th className="px-6 py-4 font-semibold">NO. TELP</th>
                  <th className="px-6 py-4 font-semibold">TGL MULAI</th>
                  <th className="px-6 py-4 font-semibold">TGL SELESAI</th>
                    <th className="px-6 py-4 font-semibold text-center">TOTAL HARI</th>
                    <th className="px-6 py-4 font-semibold text-center">STATUS</th>
                  {userRole === 'atasan' && <th className="px-6 py-4 font-semibold text-center">AKSI</th>}
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-100 dark:divide-gray-700 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {(() => {

                const sortedRequests = [...filteredRequests].sort((a, b) => {
                  const dateA = new Date(a['Tanggal Mulai'] || a['Timestamp']).getTime();
                  const dateB = new Date(b['Tanggal Mulai'] || b['Timestamp']).getTime();
                  return dateB - dateA;
                });
                
                return sortedRequests.map((req, idx) => (

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
                    <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {req['Nama Backup'] || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req['No Telp / HP'] || req['No Telp'] || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req['Tanggal Mulai'] ? new Date(req['Tanggal Mulai']).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req['Tanggal Selesai'] ? new Date(req['Tanggal Selesai']).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                        {req['Total Hari'] ? `${req['Total Hari']} Hari` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(() => {
                           const namaBackup = req['Nama Backup'] || '';
                           const noTelp = req['No Telp / HP'] || req['No Telp'] || '';
                           const hasNama = namaBackup.toString().trim() !== '';
                           const hasTelp = noTelp.toString().trim() !== '';
                           
                           if (hasNama && hasTelp) {
                             return <div className="w-4 h-4 rounded-full bg-emerald-500 mx-auto shadow-sm" title="Lengkap (Hijau)"></div>;
                           } else if (hasNama && !hasTelp) {
                             return <div className="w-4 h-4 rounded-full bg-yellow-400 mx-auto shadow-sm" title="No Telp Belum Ada (Kuning)"></div>;
                           } else {
                             return <div className="w-4 h-4 rounded-full bg-red-500 mx-auto shadow-sm" title="Belum Ada Backup (Merah)"></div>;
                           }
                        })()}
                      </td>
                      {userRole === 'atasan' && (<td className="px-6 py-4"><div className="flex gap-2 justify-center"><button onClick={() => handleEditClick(req)} className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors" title="Edit Data"><Pencil size={18} /></button><button onClick={() => handleDeleteClick(req)} className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors" title="Hapus Data"><Trash2 size={18} /></button></div></td>)}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada data backup yang ditemukan.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Data Backup
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama Karyawan Cuti</label>
                <input type="text" readOnly value={editingRequest?.['Nama Karyawan'] || ''} className={`w-full px-3 py-2 rounded-md border text-sm bg-opacity-50 cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama Backup</label>
                <input 
                  type="text" 
                  value={editForm.namaBackup} 
                  onChange={(e) => setEditForm({...editForm, namaBackup: e.target.value.replace(/\b\w/g, c => c.toUpperCase())})}
                  className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-[#0c392c] ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No Telp / HP</label>
                <input 
                  type="tel" 
                  value={editForm.noTelp} 
                  onChange={(e) => setEditForm({...editForm, noTelp: e.target.value.replace(/\D/g, '')})}
                  className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-[#0c392c] ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#0c392c] hover:bg-[#082a20] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


