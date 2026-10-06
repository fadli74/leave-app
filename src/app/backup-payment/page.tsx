'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/components/MainLayout';

export default function BackupPaymentForm() {
  const { isDarkMode } = useAppContext();
  
  const [formData, setFormData] = useState({
    namaBackup: '',
    cabangDitempatkan: '',
    namaKaryawan: '',
    employeeId: '',
    job: '',
    bank: '',
    noRekening: '',
    tanggalBackup: '',
    fotoMasuk: '',
    fotoPulang: '',
    payment: ''
  });
  
  const [fotoMasukName, setFotoMasukName] = useState('');
  const [fotoPulangName, setFotoPulangName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  interface EmployeeData {
    cabang: string;
    empId: string;
    name: string;
    job: string;
  }
  const [allEmployees, setAllEmployees] = useState<EmployeeData[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://docs.google.com/spreadsheets/d/1UyaqSC7BxG9wIEyVTHMnZU6dB---juCogG2pzAQL7XE/export?format=csv&gid=547191360');
        const csv = await res.text();
        const lines = csv.split('\n');
        
        const uniqueBranches = new Set<string>();
        const employees: EmployeeData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
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
          
          if (currentline.length >= 6) {
            const cabang = currentline[0].replace(/^"|"$/g, '');
            const empId = currentline[2].replace(/^"|"$/g, '');
            const name = currentline[3].replace(/^"|"$/g, '');
            const job = currentline[5].replace(/^"|"$/g, '');
            
            if (cabang) {
              uniqueBranches.add(cabang);
              employees.push({ cabang, empId, name, job });
            }
          }
        }
        setBranches(Array.from(uniqueBranches).sort());
        setAllEmployees(employees);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Filter employees based on selected branch
  const filteredEmployees = allEmployees.filter(emp => emp.cabang === formData.cabangDitempatkan).sort((a, b) => a.name.localeCompare(b.name));


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]); // get only base64 data
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'fotoMasuk' | 'fotoPulang') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (field === 'fotoMasuk') setFotoMasukName(file.name);
      else setFotoPulangName(file.name);
      
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, [field]: base64 }));
      } catch (error) {
        console.error("Error converting file to base64", error);
        alert("Gagal memproses gambar.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cabangDitempatkan') {
      // If branch changes, reset employee selection
      setFormData(prev => ({ 
        ...prev, 
        cabangDitempatkan: value,
        namaKaryawan: '',
        employeeId: '',
        job: ''
      }));
    } else if (name === 'namaKaryawan') {
      // If employee changes, auto-fill empId and job
      const selectedEmp = filteredEmployees.find(emp => emp.name === value);
      if (selectedEmp) {
        setFormData(prev => ({
          ...prev,
          namaKaryawan: selectedEmp.name,
          employeeId: selectedEmp.empId,
          job: selectedEmp.job
        }));
      } else {
        setFormData(prev => ({ ...prev, namaKaryawan: value, employeeId: '', job: '' }));
      }
    } else if (name === 'noRekening') {
      // Hanya izinkan angka untuk nomor rekening
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // We will just simulate a submission for now since we don't have the new Apps Script URL
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Data Backup & Payment berhasil disimpan! (SIMULASI)");
      
      // Reset form
      setFormData({
        namaBackup: '',
        cabangDitempatkan: '',
        namaKaryawan: '',
        employeeId: '',
        job: '',
        bank: '',
        noRekening: '',
        tanggalBackup: '',
        fotoMasuk: '',
        fotoPulang: '',
        payment: ''
      });
      setFotoMasukName('');
      setFotoPulangName('');
    } catch (err) {
      alert("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `mt-1 block w-full rounded-md shadow-sm sm:text-sm px-3 py-2 border focus:outline-none focus:ring-2 focus:border-transparent ${
    isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-[#0c392c]' : 'bg-white border-gray-300 text-gray-900 focus:ring-[#0c392c]'
  }`;
  const labelClass = `block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`max-w-4xl mx-auto rounded-xl shadow-md overflow-hidden p-6 md:p-8 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
      <div className="text-center mb-8">
        <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Form Foto Backup</h2>
        <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Isi data absensi (foto masuk/pulang) untuk karyawan pengganti (backup).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="namaBackup" className={labelClass}>Nama Backup</label>
            <input type="text" name="namaBackup" id="namaBackup" required value={formData.namaBackup} onChange={handleChange} className={inputClass} placeholder="Nama karyawan pengganti" />
          </div>
          <div>
            <label htmlFor="cabangDitempatkan" className={labelClass}>
              Cabang Ditempatkan
              {isLoadingData && <span className="text-blue-500 text-xs ml-2">(Memuat data...)</span>}
            </label>
            <select 
              name="cabangDitempatkan" 
              id="cabangDitempatkan" 
              required 
              value={formData.cabangDitempatkan} 
              onChange={handleChange} 
              className={inputClass}
            >
              <option value="">Pilih Cabang...</option>
              {branches.map((b, idx) => (
                <option key={idx} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="namaKaryawan" className={labelClass}>Nama Karyawan (Yang Digantikan)</label>
            <select 
              name="namaKaryawan" 
              id="namaKaryawan" 
              required 
              disabled={!formData.cabangDitempatkan || isLoadingData}
              value={formData.namaKaryawan} 
              onChange={handleChange} 
              className={inputClass}
            >
              <option value="">{formData.cabangDitempatkan ? 'Pilih Karyawan...' : 'Pilih cabang dulu...'}</option>
              {filteredEmployees.map((emp, idx) => (
                <option key={idx} value={emp.name}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="employeeId" className={labelClass}>Employee ID</label>
            <input type="text" name="employeeId" id="employeeId" required readOnly value={formData.employeeId} className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Terisi otomatis..." />
          </div>
          <div>
            <label htmlFor="job" className={labelClass}>Job</label>
            <input type="text" name="job" id="job" required readOnly value={formData.job} className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Terisi otomatis..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="bank" className={labelClass}>Bank</label>
            <input type="text" name="bank" id="bank" required value={formData.bank} onChange={handleChange} className={inputClass} placeholder="Nama Bank (BCA, Mandiri, dll)" />
          </div>
          <div>
            <label htmlFor="noRekening" className={labelClass}>No Rekening</label>
            <input type="tel" name="noRekening" id="noRekening" required value={formData.noRekening} onChange={handleChange} className={inputClass} placeholder="Hanya angka..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="tanggalBackup" className={labelClass}>Tanggal Backup</label>
            <input type="date" name="tanggalBackup" id="tanggalBackup" required value={formData.tanggalBackup} onChange={handleChange} className={inputClass} style={isDarkMode ? { colorScheme: 'dark' } : {}} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Foto Masuk</label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${isDarkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
              <div className="space-y-1 text-center">
                <svg className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm justify-center">
                  <label htmlFor="fotoMasuk" className={`relative cursor-pointer rounded-md font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300 focus-within:ring-emerald-500' : 'text-[#0c392c] hover:text-[#082a20] focus-within:ring-[#0c392c]'}`}>
                    <span>Upload foto masuk</span>
                    <input id="fotoMasuk" name="fotoMasuk" type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileChange(e, 'fotoMasuk')} required />
                  </label>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>PNG, JPG up to 5MB</p>
                {fotoMasukName && <p className="text-xs text-green-500 mt-2 font-medium break-all">{fotoMasukName} (Siap diupload)</p>}
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Foto Pulang</label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${isDarkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
              <div className="space-y-1 text-center">
                <svg className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm justify-center">
                  <label htmlFor="fotoPulang" className={`relative cursor-pointer rounded-md font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300 focus-within:ring-emerald-500' : 'text-[#0c392c] hover:text-[#082a20] focus-within:ring-[#0c392c]'}`}>
                    <span>Upload foto pulang</span>
                    <input id="fotoPulang" name="fotoPulang" type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileChange(e, 'fotoPulang')} required />
                  </label>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>PNG, JPG up to 5MB</p>
                {fotoPulangName && <p className="text-xs text-green-500 mt-2 font-medium break-all">{fotoPulangName} (Siap diupload)</p>}
              </div>
            </div>
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
            {isSubmitting ? 'Mengirim Data...' : 'Simpan Data Backup'}
          </button>
        </div>
      </form>
    </div>
  );
}
