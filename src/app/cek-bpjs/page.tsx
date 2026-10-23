'use client';
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Copy, Check, User, Building2, BadgeCheck, Briefcase, CreditCard, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/components/MainLayout';

const API_URL = 'https://script.google.com/macros/s/AKfycbzCEjO2z3tnGwRtY4-zxLjrn-YEUh5pq7BKaDGOcJvPH3l8HxRaPdnU7uf0pm1giW0/exec';

export default function CekBpjsPage() {
  const { isDarkMode } = useAppContext();
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCabang, setSelectedCabang] = useState('');
  const [searchName, setSearchName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('bpjsKaryawanCache');
    if (cached) {
      try {
        setEmployees(JSON.parse(cached));
        setIsLoading(false);
      } catch (e) {
        localStorage.removeItem('bpjsKaryawanCache');
      }
    }

    fetch(API_URL + '?sheetName=' + encodeURIComponent('Daftar Karyawan'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const valid = data.filter(emp => emp['Employee Name']);
          setEmployees(valid);
          localStorage.setItem('bpjsKaryawanCache', JSON.stringify(valid));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Gagal memuat data BPJS karyawan:', err);
        setIsLoading(false);
      });
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const uniqueCabangs = Array.from(
    new Set(employees.map(emp => emp['CABANG']).filter(Boolean))
  ).sort();

  const filteredEmployees = employees.filter(emp => {
    const matchCabang = !selectedCabang || emp['CABANG'] === selectedCabang;
    const q = searchName.toLowerCase().trim();
    const matchName =
      !q ||
      String(emp['Employee Name'] || '').toLowerCase().includes(q) ||
      String(emp['Employee Id'] || '').toLowerCase().includes(q);
    return matchCabang && matchName;
  });

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    setSearchName(emp['Employee Name'] || '');
    setSelectedCabang(emp['CABANG'] || selectedCabang);
    setShowSuggestions(false);
    setCopied(false);
  };

  const handleCopyBpjs = (bpjsNo: string) => {
    if (!bpjsNo) return;
    navigator.clipboard.writeText(bpjsNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass = `mt-1 block w-full rounded-lg shadow-sm focus:border-[#0c392c] focus:ring-[#0c392c] p-2.5 border text-sm ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const labelClass = `block text-sm font-medium ${
    isDarkMode ? 'text-gray-300' : 'text-gray-700'
  }`;

  const bpjsValue = selectedEmployee
    ? String(selectedEmployee['BPJS PU'] ?? '').trim()
    : '';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search / Selection Card */}
      <div
        className={`rounded-xl shadow-md p-6 md:p-8 border ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#0c392c] text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2
              className={`text-xl md:text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Cek Data BPJS Karyawan
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Pilih cabang dan nama karyawan untuk melihat nomor kepesertaan BPJS PU.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pilih Cabang */}
          <div>
            <label htmlFor="cabang" className={labelClass}>
              Cabang Ditempatkan
              {isLoading && (
                <span className="text-blue-500 text-xs ml-2">(Memuat data...)</span>
              )}
            </label>
            <select
              id="cabang"
              value={selectedCabang}
              onChange={e => {
                setSelectedCabang(e.target.value);
                setSearchName('');
                setSelectedEmployee(null);
                setShowSuggestions(false);
              }}
              className={inputClass}
            >
              <option value="">Semua Cabang ({uniqueCabangs.length} Cabang)</option>
              {uniqueCabangs.map(cab => (
                <option key={cab} value={cab}>
                  {cab}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih / Cari Nama Karyawan */}
          <div className="relative">
            <label htmlFor="namaKaryawan" className={labelClass}>
              Nama Karyawan / Employee ID
            </label>
            <div className="relative">
              <input
                type="text"
                id="namaKaryawan"
                autoComplete="off"
                value={searchName}
                onChange={e => {
                  setSearchName(e.target.value);
                  setSelectedEmployee(null);
                  setShowSuggestions(true);
                }}
                onClick={e => {
                  e.stopPropagation();
                  setShowSuggestions(true);
                }}
                placeholder="Ketik atau pilih nama karyawan..."
                className={`${inputClass} pr-9`}
              />
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              {showSuggestions && filteredEmployees.length > 0 && (
                <ul
                  className={`absolute z-20 w-full mt-1 max-h-60 overflow-auto rounded-lg shadow-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {filteredEmployees.map((emp, idx) => (
                    <li
                      key={idx}
                      onClick={e => {
                        e.stopPropagation();
                        handleSelectEmployee(emp);
                      }}
                      className={`cursor-pointer px-4 py-2.5 text-sm flex items-center justify-between border-b last:border-b-0 ${
                        isDarkMode
                          ? 'text-gray-200 hover:bg-gray-700 border-gray-700/60'
                          : 'text-gray-700 hover:bg-emerald-50/60 border-gray-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{emp['Employee Name']}</div>
                        <div className="text-xs opacity-60">
                          {emp['Employee Id']} • {emp['CABANG']}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          emp['BPJS PU']
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {emp['BPJS PU'] ? 'Ada BPJS' : 'Kosong'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result Card */}
      {selectedEmployee ? (
        <div
          className={`rounded-xl shadow-lg overflow-hidden border transition-all ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          {/* Card Header Banner */}
          <div className="bg-gradient-to-r from-[#0c392c] to-[#145a46] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-xl shrink-0 border border-white/20">
                {String(selectedEmployee['Employee Name'] || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {selectedEmployee['Employee Name']}
                </h3>
                <p className="text-emerald-200 text-sm">
                  ID: {selectedEmployee['Employee Id'] || '-'} •{' '}
                  {selectedEmployee['CABANG'] || '-'}
                </p>
              </div>
            </div>

            <div>
              {bpjsValue ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Terdaftar BPJS PU
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  <AlertCircle size={14} />
                  Nomor BPJS Belum Tersedia
                </span>
              )}
            </div>
          </div>

          {/* BPJS Number Highlight Box */}
          <div className="p-6 md:p-8 space-y-6">
            <div
              className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                bpjsValue
                  ? isDarkMode
                    ? 'bg-emerald-950/30 border-emerald-800/60'
                    : 'bg-emerald-50/70 border-emerald-200'
                  : isDarkMode
                  ? 'bg-gray-800/60 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                    bpjsValue
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  <CreditCard size={22} />
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Nomor BPJS Ketenagakerjaan (PU)
                  </p>
                  <p
                    className={`text-2xl md:text-3xl font-extrabold tracking-wide mt-0.5 font-mono ${
                      bpjsValue
                        ? isDarkMode
                          ? 'text-emerald-400'
                          : 'text-[#0c392c]'
                        : 'text-gray-400 italic text-lg font-sans'
                    }`}
                  >
                    {bpjsValue || 'Belum ada nomor BPJS'}
                  </p>
                </div>
              </div>

              {bpjsValue && (
                <button
                  onClick={() => handleCopyBpjs(bpjsValue)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={15} />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      Salin Nomor
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div
                className={`p-3.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800/40 border-gray-800'
                    : 'bg-gray-50/70 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <User size={14} />
                  <span>Employee ID</span>
                </div>
                <div
                  className={`font-bold text-sm ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {selectedEmployee['Employee Id'] || '-'}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800/40 border-gray-800'
                    : 'bg-gray-50/70 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <Building2 size={14} />
                  <span>Cabang Ditempatkan</span>
                </div>
                <div
                  className={`font-bold text-sm ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {selectedEmployee['CABANG'] || '-'}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800/40 border-gray-800'
                    : 'bg-gray-50/70 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <Briefcase size={14} />
                  <span>Jabatan / Unit</span>
                </div>
                <div
                  className={`font-bold text-sm ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {selectedEmployee['Jabatan'] || '-'}{' '}
                  {selectedEmployee['Unit'] ? `(${selectedEmployee['Unit']})` : ''}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800/40 border-gray-800'
                    : 'bg-gray-50/70 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <BadgeCheck size={14} />
                  <span>Customer</span>
                </div>
                <div
                  className={`font-bold text-sm ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {selectedEmployee['Coutomer'] ||
                    selectedEmployee['Costomer'] ||
                    selectedEmployee['Customer'] ||
                    '-'}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800/40 border-gray-800'
                    : 'bg-gray-50/70 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <Building2 size={14} />
                  <span>Department</span>
                </div>
                <div
                  className={`font-bold text-sm ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {selectedEmployee['Department'] || '-'}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800/40 border-gray-800'
                    : 'bg-gray-50/70 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <User size={14} />
                  <span>Masa Kerja</span>
                </div>
                <div
                  className={`font-bold text-sm ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {selectedEmployee['Lama Masa berkerja'] ||
                    selectedEmployee['Masa Kerja'] ||
                    '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border p-10 text-center ${
            isDarkMode
              ? 'bg-gray-900/50 border-gray-800 text-gray-400'
              : 'bg-white border-gray-100 text-gray-500'
          }`}
        >
          <ShieldCheck
            size={48}
            className="mx-auto mb-3 text-emerald-600/40 dark:text-emerald-400/30"
          />
          <p className="font-medium text-sm">
            Silakan pilih cabang dan ketik nama karyawan di atas untuk menampilkan kartu BPJS.
          </p>
        </div>
      )}
    </div>
  );
}
