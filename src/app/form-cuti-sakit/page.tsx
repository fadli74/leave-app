'use client';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/components/MainLayout';

const API_URL = 'https://script.google.com/macros/s/AKfycbzCEjO2z3tnGwRtY4-zxLjrn-YEUh5pq7BKaDGOcJvPH3l8HxRaPdnU7uf0pm1giW0/exec';

export default function LeaveForm() {
  const { isDarkMode } = useAppContext();
  
  // Calculate tomorrow's date for the min attribute in local timezone (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);

  // State untuk Data Master (Atasan, Jenis Cuti)
  const [masterData, setMasterData] = useState({
    atasan: [] as string[],
    jenisCuti: ["Cuti Tahunan", "Cuti Nikahan", "Cuti Meninggal", "Sakit"] // Fallback default
  });

  const [fileData, setFileData] = useState<{base64: string, name: string, mimeType: string} | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    empId: '',
    cabang: '',
    job: '',
    jenisCuti: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    alasan: '',
    namaBackup: '',
    noTelp: '',
    namaAtasan: '',
    customer: ''
  });

  // Fetch daftar karyawan dan Data Master
  useEffect(() => {
    // --- SWR Cache Loading ---
    const cachedKaryawan = localStorage.getItem('formKaryawanData');
    if (cachedKaryawan) {
      setEmployees(JSON.parse(cachedKaryawan));
      setIsLoadingNames(false);
    }
    
    const cachedMaster = localStorage.getItem('masterDataCache');
    if (cachedMaster) {
      setMasterData(JSON.parse(cachedMaster));
    }

    // 1. Fetch Daftar Karyawan (Background)
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setEmployees(data);
          localStorage.setItem('formKaryawanData', JSON.stringify(data));
        }
        setIsLoadingNames(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingNames(false);
      });

    // 2. Fetch Data Master (Background)
    fetch(API_URL + '?sheetName=Master Data')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const listAtasan = data.map((item: any) => item['Atasan']).filter((v: any) => v);
          const listCuti = data.map((item: any) => item['Jenis Cuti / Izin'] || item['Jenis Cuti/Izin']).filter((v: any) => v);
          
          const newMasterData = {
            atasan: Array.from(new Set(listAtasan)) as string[],
            jenisCuti: listCuti.length > 0 ? (Array.from(new Set(listCuti)) as string[]) : masterData.jenisCuti
          };
          
          setMasterData(newMasterData);
          localStorage.setItem('masterDataCache', JSON.stringify(newMasterData));
        }
      })
      .catch(err => console.error("Gagal mengambil Data Master:", err));
  }, []);

  // Update filteredEmployees if employees loads AFTER user has typed
  useEffect(() => {
    if (formData.nama.length > 0) {
      const filtered = employees.filter(emp => 
        (emp['Employee Name'] || '').toString().toLowerCase().includes(formData.nama.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [employees, formData.nama]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    if (e.target.name === 'noTelp') {
      value = value.replace(/\D/g, ''); 
    } 
    else if (e.target.name === 'customer' || e.target.name === 'namaBackup') {
      value = value.replace(/\b\w/g, char => char.toUpperCase());
    }
    else if (e.target.name === 'alasan') {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setFileData({
            base64: event.target.result.toString(),
            name: file.name,
            mimeType: file.type || 'application/octet-stream'
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      setFileData(null);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedName = e.target.value;
    
    setFormData(prev => ({ 
      ...prev, 
      nama: selectedName,
      empId: '', // Reset
      job: '',
      cabang: '',
      namaAtasan: '',
      customer: ''
    }));

    if (selectedName.length > 0) {
      const filtered = employees.filter(emp => 
        (emp['Employee Name'] || '').toString().toLowerCase().includes(selectedName.toLowerCase())
      );
      setFilteredEmployees(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectEmployee = (emp: any) => {
    setFormData(prev => ({
      ...prev,
      nama: emp['Employee Name'] || '',
      empId: emp['Employee Id'] || '',
      job: emp['Jabatan'] || '',
      cabang: emp['CABANG'] || '',
      namaAtasan: emp['Atasan'] || '',
      customer: emp['Coutomer'] || emp['Costomer'] || emp['Customer'] || ''
    }));
    setShowSuggestions(false);
  };

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Kalkulasi Total Hari (Tanggal Selesai - Tanggal Mulai + 1 Hari)
    let totalHari = 0;
    if (formData.tanggalMulai && formData.tanggalSelesai) {
      const start = new Date(formData.tanggalMulai);
      const end = new Date(formData.tanggalSelesai);
      
      const diffTime = end.getTime() - start.getTime();
      
      if (diffTime >= 0) {
        totalHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } else {
        alert('Tanggal Selesai tidak boleh lebih awal dari Tanggal Mulai!');
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      sheetName: 'Form Cuti & Izin',
      data: {
        'Nama Karyawan': formData.nama,
        'Employee Id': formData.empId,
        'Job': formData.job,
        'Posisi/Jabatan': formData.job,
        'Cabang Ditempatkan': formData.cabang,
        'Jenis Cuti/Izin': formData.jenisCuti,
        'Tanggal Mulai': formData.tanggalMulai,
        'Tanggal Selesai': formData.tanggalSelesai,
        'Total Hari': totalHari,
        'Alasan': formData.alasan,
        'Nama Backup': formData.namaBackup,
        'No Telp / HP': formData.noTelp,
        'No Telp': formData.noTelp,
        'Link Lampiran (Surat Dokter)': '', 
        'Nama Atasan (Approver)': formData.namaAtasan,
        'Nama Atasan': formData.namaAtasan,
        'Approver': formData.namaAtasan,
        'Customer': formData.customer,
        'Coutomer': formData.customer,
        'Costomer': formData.customer
      }
    };
    
    // Jika ada file lampiran, tambahkan ke payload
    if (fileData) {
      (payload as any).file = fileData;
      (payload as any).folderId = '1P31uksPFxbhrjorJ3GV4IIlp2McwbWiS'; // Folder spesifik dari user
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        alert('Terima kasih telah mengisi form ini');
        setFormData({
          nama: '', empId: '', cabang: '', job: '', jenisCuti: '', tanggalMulai: '',
          tanggalSelesai: '', alasan: '', namaBackup: '', noTelp: '', namaAtasan: '', customer: ''
        });
        setFileData(null);
        // Reset file input in UI
        const fileInput = document.getElementById('lampiran') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        alert('Oops, gagal menyimpan. Coba lagi.');
      }
    } catch (error) {
      console.error(error);
      alert('Gagal mengirim data. Pastikan Google Apps Script sudah diperbarui dengan kode terbaru!');
    }
    
    setIsSubmitting(false);
  };

  const inputClass = `mt-1 block w-full rounded-md shadow-sm focus:border-[#0c392c] focus:ring-[#0c392c] p-2 border ${
    isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const labelClass = `block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`max-w-3xl mx-auto rounded-xl shadow-md overflow-hidden p-6 md:p-8 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
      <div className="text-center mb-8">
        <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Form Cuti dan Izin Sakit</h2>
        <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Isi formulir di bawah ini untuk mengajukan cuti atau izin sakit.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label htmlFor="nama" className={labelClass}>
              Nama Karyawan 
              {isLoadingNames && (
                <span className="text-blue-500 text-xs ml-2">(Menyiapkan auto-fill...)</span>
              )}
              {!isLoadingNames && employees.length === 0 && (
                <span className="text-red-500 text-xs ml-2">(Gagal memuat data)</span>
              )}
            </label>
            <div className="relative">
              <input 
                type="text" 
                name="nama" 
                id="nama" 
                autoComplete="off"
                required 
                value={formData.nama} 
                onChange={handleNameChange}
                onClick={(e) => { e.stopPropagation(); if (formData.nama.length > 0) setShowSuggestions(true); }}
                className={inputClass} 
                placeholder="Ketik nama karyawan..."
              />
              {/* Custom Autocomplete Dropdown */}
              {showSuggestions && filteredEmployees.length > 0 && (
                <ul className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  {filteredEmployees.map((emp, idx) => (
                    <li 
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); selectEmployee(emp); }}
                      className={`cursor-pointer px-4 py-2 text-sm ${
                        isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {emp['Employee Name']} <span className="text-xs opacity-50 ml-1">- {emp['CABANG']}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="empId" className={labelClass}>Employee Id</label>
            <input type="text" name="empId" id="empId" readOnly required value={formData.empId} className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Terisi otomatis..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="cabang" className={labelClass}>Cabang Ditempatkan</label>
            <input type="text" name="cabang" id="cabang" readOnly required value={formData.cabang} className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Terisi otomatis..." />
          </div>
          <div>
            <label htmlFor="job" className={labelClass}>Job (Posisi/Jabatan)</label>
            <input type="text" name="job" id="job" readOnly required value={formData.job} className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Terisi otomatis..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="jenisCuti" className={labelClass}>Jenis Cuti/Izin</label>
            <select name="jenisCuti" id="jenisCuti" required value={formData.jenisCuti} onChange={handleChange} className={inputClass}>
              <option value="">Pilih Jenis...</option>
              {masterData.jenisCuti.map((jenis) => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="customer" className={labelClass}>Customer</label>
            <input type="text" name="customer" id="customer" required value={formData.customer} onChange={handleChange} className={inputClass} placeholder="Terisi otomatis atau ketik manual..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="tanggalMulai" className={labelClass}>Tanggal Mulai</label>
            <input type="date" name="tanggalMulai" id="tanggalMulai" required min={minDate} value={formData.tanggalMulai} onChange={handleChange} className={inputClass} style={isDarkMode ? { colorScheme: 'dark' } : {}} />
          </div>
          <div>
            <label htmlFor="tanggalSelesai" className={labelClass}>Tanggal Selesai</label>
            <input type="date" name="tanggalSelesai" id="tanggalSelesai" required min={formData.tanggalMulai || minDate} value={formData.tanggalSelesai} onChange={handleChange} className={inputClass} style={isDarkMode ? { colorScheme: 'dark' } : {}} />
          </div>
        </div>

        <div>
          <label htmlFor="alasan" className={labelClass}>Alasan</label>
          <textarea name="alasan" id="alasan" rows={3} required value={formData.alasan} onChange={handleChange} className={inputClass} placeholder="Tuliskan alasan pengajuan..."></textarea>
        </div>

        <div>
          <label htmlFor="lampiran" className={labelClass}>Lampiran (Surat Dokter/Lainnya)</label>
          <input type="file" name="lampiran" id="lampiran" onChange={handleFileChange}
            className={`mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold cursor-pointer ${
              isDarkMode 
                ? 'text-gray-400 file:bg-gray-800 file:text-gray-200 hover:file:bg-gray-700' 
                : 'text-gray-600 file:bg-[#0c392c] file:text-white hover:file:bg-[#082a20]'
            }`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="namaBackup" className={labelClass}>Nama Backup</label>
            <input type="text" name="namaBackup" id="namaBackup" value={formData.namaBackup} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="noTelp" className={labelClass}>No Telp / HP</label>
            <input type="tel" name="noTelp" id="noTelp" required value={formData.noTelp} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={isSubmitting}
            className={`flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 ${
              isDarkMode 
                ? 'bg-white text-[#0c392c] hover:bg-gray-100 focus:ring-white' 
                : 'bg-[#0c392c] text-white hover:bg-[#082a20] focus:ring-[#0c392c]'
            }`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Data Pengajuan'}
          </button>
        </div>
      </form>
    </div>
  );
}

