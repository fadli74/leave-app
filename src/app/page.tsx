'use client';
import React from 'react';
import { Users, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useAppContext } from '@/components/MainLayout';



export default function Dashboard() {
  const { isDarkMode, userRole, startDate, endDate, searchQuery } = useAppContext();
  const [rawFormData, setRawFormData] = React.useState<any[]>([]);
  const [totalKaryawan, setTotalKaryawan] = React.useState<number | string>('...');
  const [totalTanpaKeterangan, setTotalTanpaKeterangan] = React.useState<number | string>('...');
  const [totalCuti, setTotalCuti] = React.useState<number | string>('...');
  const [totalSakit, setTotalSakit] = React.useState<number | string>('...');
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [customerStats, setCustomerStats] = React.useState<any[]>([]);
  const [employeeCounts, setEmployeeCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    // 1. Tampilkan dari cache
    const cachedTotal = localStorage.getItem('totalKaryawanCache');
    if (cachedTotal) {
      setTotalKaryawan(parseInt(cachedTotal, 10));
    }

    const API_URL = 'https://script.google.com/macros/s/AKfycbzCEjO2z3tnGwRtY4-zxLjrn-YEUh5pq7BKaDGOcJvPH3l8HxRaPdnU7uf0pm1giW0/exec';

    // 2. Ambil data Daftar Karyawan terbaru dari Spreadsheet
    fetch(API_URL + '?sheetName=' + encodeURIComponent('Daftar Karyawan'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const validEmployees = data.filter(emp => emp['Employee Name'] || emp['Nama Karyawan']);
          const total = validEmployees.length;
          setTotalKaryawan(total);
          localStorage.setItem('totalKaryawanCache', total.toString());

          const counts: Record<string, number> = {};
          validEmployees.forEach(emp => {
            const cust = String(emp['Coutomer'] || emp['Costomer'] || '').trim();
            if (cust) {
               counts[cust] = (counts[cust] || 0) + 1;
            }
          });
          setEmployeeCounts(counts);
        }
      })
      .catch(err => {
        console.error("Gagal mengambil data karyawan:", err);
        if (!cachedTotal) setTotalKaryawan('-');
      });

    // 3. Ambil data Form Cuti & Izin terbaru
    fetch(API_URL + '?sheetName=' + encodeURIComponent('Form Cuti & Izin'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRawFormData(data);
        }
      })
      .catch(err => {
        console.error("Gagal mengambil data form cuti:", err);
        setTotalTanpaKeterangan('-');
        setTotalCuti('-');
        setTotalSakit('-');
      });
  }, []);

  React.useEffect(() => {
    if (!rawFormData || rawFormData.length === 0) return;

    let dataToProcess = rawFormData;
    
    if (startDate) {
      dataToProcess = dataToProcess.filter(row => {
        const ts = row['Tanggal Mulai'] || row['Timestamp'];
        if (!ts) return true;
        return new Date(ts) >= new Date(startDate);
      });
    }
    
    if (endDate) {
      dataToProcess = dataToProcess.filter(row => {
        const ts = row['Tanggal Mulai'] || row['Timestamp'];
        if (!ts) return true;
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        return new Date(ts) <= d;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      dataToProcess = dataToProcess.filter(row => {
        return (row['Nama Karyawan'] || '').toLowerCase().includes(q) ||
               (row['Costomer'] || '').toLowerCase().includes(q) ||
               (row['Cabang Ditempatkan'] || '').toLowerCase().includes(q);
      });
    }

    let tanpaKet = 0;
    let cuti = 0;
    let sakit = 0;
    
    const groupedByDate: Record<string, any> = {};
    const groupedByCustomer: Record<string, any> = {};

    // Inisialisasi 7 hari terakhir agar grafik tidak kosong
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('id-ID', { month: 'short' });
      const dateStr = `${day} ${month}`;
      groupedByDate[dateStr] = { name: dateStr, cuti: 0, sakit: 0, tanpa: 0, rawDate: d.getTime() };
    }

    dataToProcess.forEach(row => {
      const jenis = String(row['Jenis Cuti/Izin'] || '').toLowerCase();
      if (jenis.includes('tanpa keterangan')) tanpaKet++;
      else if (jenis.includes('cuti')) cuti++;
      else if (jenis.includes('sakit')) sakit++;
      
      const timestamp = row['Tanggal Mulai'] || row['Timestamp'];
      if (timestamp) {
         const dateObj = new Date(timestamp);
         const day = dateObj.getDate().toString().padStart(2, '0');
         const month = dateObj.toLocaleString('id-ID', { month: 'short' });
         const dateStr = `${day} ${month}`;
         
         if (groupedByDate[dateStr]) {
           if (jenis.includes('tanpa keterangan')) groupedByDate[dateStr].tanpa++;
           else if (jenis.includes('cuti')) groupedByDate[dateStr].cuti++;
           else if (jenis.includes('sakit')) groupedByDate[dateStr].sakit++;
         } else {
           groupedByDate[dateStr] = { name: dateStr, cuti: 0, sakit: 0, tanpa: 0, rawDate: dateObj.getTime() };
           if (jenis.includes('tanpa keterangan')) groupedByDate[dateStr].tanpa++;
           else if (jenis.includes('cuti')) groupedByDate[dateStr].cuti++;
           else if (jenis.includes('sakit')) groupedByDate[dateStr].sakit++;
         }
      }
      
      let customer = String(row['Costomer'] || '').trim();
      if (customer && customer.toLowerCase() !== 'approved') {
          if (!groupedByCustomer[customer]) {
             groupedByCustomer[customer] = { name: customer, cuti: 0, sakit: 0, tanpa: 0 };
          }
          if (jenis.includes('tanpa keterangan')) groupedByCustomer[customer].tanpa++;
          else if (jenis.includes('cuti')) groupedByCustomer[customer].cuti++;
          else if (jenis.includes('sakit')) groupedByCustomer[customer].sakit++;
      }
    });
    
    setTotalTanpaKeterangan(tanpaKet);
    setTotalCuti(cuti);
    setTotalSakit(sakit);
    
    const newChartData = Object.values(groupedByDate).sort((a: any, b: any) => a.rawDate - b.rawDate);
    setChartData(newChartData);
    
    const newCustomerData = Object.values(groupedByCustomer).sort((a: any, b: any) => (b.cuti + b.sakit + b.tanpa) - (a.cuti + a.sakit + a.tanpa));
    setCustomerStats(newCustomerData);
  }, [rawFormData, startDate, endDate, searchQuery]);

  if (userRole === 'umum') {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-20`}>
        <FileText size={64} className="mb-4 text-emerald-500 opacity-50" />
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Mode Akses Terbatas</h2>
        <p className="max-w-md mb-6">Anda sedang dalam mode umum. Silakan ke halaman form untuk mengajukan cuti, atau Login sebagai Atasan untuk melihat statistik dashboard.</p>
        <Link href="/form-cuti-sakit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
          Buka Form Pengajuan Cuti
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg shadow-sm border p-4 flex items-center gap-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className={`w-12 h-12 rounded-md flex items-center justify-center ${isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
            <Users size={24} />
          </div>
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Karyawan</p>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {typeof totalKaryawan === 'number' ? new Intl.NumberFormat('id-ID').format(totalKaryawan) : totalKaryawan}
            </h3>
          </div>
        </div>
        
        <div className={`rounded-lg shadow-sm border p-4 flex items-center gap-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className={`w-12 h-12 rounded-md flex items-center justify-center ${isDarkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
            <Clock size={24} />
          </div>
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanpa keterangan</p>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{totalTanpaKeterangan}</h3>
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-4 flex items-center gap-4 text-white ${isDarkMode ? 'bg-emerald-900 border-emerald-800' : 'bg-[#0c392c]'}`}>
          <div className="w-12 h-12 rounded-md bg-white/20 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-300 font-medium">Cuti Disetujui</p>
            <h3 className="text-2xl font-bold">{totalCuti}</h3>
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-4 flex items-center gap-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className={`w-12 h-12 rounded-md flex items-center justify-center ${isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'}`}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Izin Sakit</p>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{totalSakit}</h3>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div className={`p-4 rounded-lg shadow-sm border flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`} style={{ minHeight: '250px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Tren Pengajuan & Kehadiran</h3>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Data Terkini</span>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#eee'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#888'}} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#888'}} />
                <Tooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: isDarkMode ? '#374151' : '#eee', color: isDarkMode ? '#fff' : '#000'}} />
                <Line type="monotone" dataKey="cuti" stroke="#3b82f6" strokeWidth={2} dot={{r: 4, fill: isDarkMode ? '#1f2937' : '#fff', stroke: '#3b82f6', strokeWidth: 2}} activeDot={{r: 6}} name="Cuti" />
                <Line type="monotone" dataKey="sakit" stroke="#ef4444" strokeWidth={2} dot={{r: 4, fill: isDarkMode ? '#1f2937' : '#fff', stroke: '#ef4444', strokeWidth: 2}} activeDot={{r: 6}} name="Sakit" />
                <Line type="monotone" dataKey="tanpa" stroke="#f59e0b" strokeWidth={2} dot={{r: 4, fill: isDarkMode ? '#1f2937' : '#fff', stroke: '#f59e0b', strokeWidth: 2}} activeDot={{r: 6}} name="Tanpa Keterangan" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer Stats Cards */}
      <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Statistik Per Customer</h3>
      {customerStats.length === 0 ? (
          <div className={`p-8 text-center text-sm rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white text-gray-500'}`}>
              Belum ada data customer
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {customerStats.map((cust, idx) => {
                const totalEmp = employeeCounts[cust.name] || 0;
                const totalAbsen = cust.cuti + cust.sakit + cust.tanpa;
                const hadir = Math.max(0, totalEmp - totalAbsen);
                
                const pctHadir = totalEmp > 0 ? ((hadir / totalEmp) * 100).toFixed(1) + '%' : '-';
                const pctCuti = totalEmp > 0 ? ((cust.cuti / totalEmp) * 100).toFixed(1) + '%' : '-';
                const pctSakit = totalEmp > 0 ? ((cust.sakit / totalEmp) * 100).toFixed(1) + '%' : '-';
                const pctTanpa = totalEmp > 0 ? ((cust.tanpa / totalEmp) * 100).toFixed(1) + '%' : '-';

                return (
                  <div key={idx} className={`p-4 rounded-lg shadow-sm border flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                    <div className={`mb-3 pb-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{cust.name}</h4>
                        <span className={`text-sm px-3 py-1 rounded-full font-bold ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                          Total: {totalEmp} org
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[11px] font-bold text-center mt-1">
                        <div className="text-emerald-500 bg-emerald-50 rounded py-0.5">Hadir: {pctHadir}</div>
                        <div className="text-blue-500 bg-blue-50 rounded py-0.5">Cuti: {pctCuti}</div>
                        <div className="text-red-500 bg-red-50 rounded py-0.5">Sakit: {pctSakit}</div>
                        <div className="text-amber-500 bg-amber-50 rounded py-0.5">Alfa: {pctTanpa}</div>
                      </div>
                    </div>
                    <div style={{ height: '160px' }}>
                      <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                        <BarChart data={[cust]} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#eee'} />
                          <XAxis dataKey="name" hide />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#888'}} />
                          <Tooltip cursor={{fill: isDarkMode ? '#374151' : '#f3f4f6'}} contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: isDarkMode ? '#374151' : '#eee', color: isDarkMode ? '#fff' : '#000'}} />
                          <Bar dataKey="cuti" name="Cuti" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                          <Bar dataKey="sakit" name="Sakit" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                          <Bar dataKey="tanpa" name="Tanpa Ket." fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={25} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
            })}
          </div>
      )}
    </>
  );
}





