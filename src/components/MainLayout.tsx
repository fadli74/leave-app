'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Users, 
  FileText, 
  CheckSquare, 
  LogOut, 
  Menu,
  Search,
  Download,
  Sun,
  Moon,
  LogIn,
  UserCog,
  Lock,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Role = 'umum' | 'atasan';

interface AppContextType {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  userRole: Role;
  setUserRole: (val: Role) => void;
  loggedInName: string;
  setLoggedInName: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userRole, setUserRole] = useState<Role>('umum');
  const [loggedInName, setLoggedInName] = useState('');
  
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local Temp States for Header Inputs
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  
  const pathname = usePathname();

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycbxKBILoYGh1HcNCU7yGTr9wON9ShjNNWpbIgp7xyvrAu8SgZRECAVLSNoY-vmpBTmKLcA/exec?sheetName=User%20Atasan');
      const users = await res.json();
      
      const user = users.find((u: any) => 
        String(u['Nama']).toLowerCase() === loginUsername.toLowerCase() && 
        String(u['Password']) === loginPassword
      );

      if (user) {
        if (user['Role'] === 'Atasan' || user['Role'] === 'atasan') {
          setUserRole('atasan');
          setLoggedInName(user['Nama']);
          setShowLoginModal(false);
          setLoginUsername('');
          setLoginPassword('');
        } else {
          setLoginError('Hanya role Atasan yang bisa login ke halaman ini.');
        }
      } else {
        setLoginError('Username atau Password salah!');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setLoginError('Gagal terhubung ke server: ' + (err.message || err));
    }
    setIsLoggingIn(false);
  };

  return (
    <AppContext.Provider value={{ isDarkMode, setIsDarkMode, userRole, setUserRole, loggedInName, setLoggedInName, startDate, setStartDate, endDate, setEndDate, searchQuery, setSearchQuery }}>
      <div className={`${isDarkMode ? 'dark' : ''} h-screen font-sans`}>
        <div className={`flex h-full overflow-hidden transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
          
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'} transition-all duration-300 ${isDarkMode ? 'bg-gray-950 border-r border-gray-800' : 'bg-[#0c392c]'} text-gray-300 flex flex-col fixed md:relative z-20 h-full overflow-hidden`}>
            <div className="p-5 text-white font-bold text-xl border-b border-white/10 truncate flex justify-between items-center">
              <span>CL - LEAVE APP</span>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-300 hover:text-white">
                ?
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-3">
              {userRole === 'atasan' && (
                <li>
                  <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                    <LayoutDashboard size={20} />
                    <span className="text-sm font-medium">Dashboard</span>
                  </Link>
                </li>
              )}
              
              <li>
                <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/form" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/form' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                  <FileText size={20} />
                  <span className="text-sm font-medium">Form Pengajuan</span>
                </Link>
              </li>

              <li>
                <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/status" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/status' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                  <Database size={20} />
                  <span className="text-sm font-medium">Status Approval</span>
                </Link>
              </li>

              <li>
                <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/backup" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/backup' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                  <Users size={20} />
                  <span className="text-sm font-medium">Backup Karyawan</span>
                </Link>
              </li>

              {userRole === 'atasan' && (
                <>
                  <li>
                    <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/approval" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/approval' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                      <CheckSquare size={20} />
                      <span className="text-sm font-medium">Approval Atasan</span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/karyawan" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/karyawan' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                      <Users size={20} />
                      <span className="text-sm font-medium">Daftar Karyawan</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
            </div>

            <div className="p-4 border-t border-white/10 space-y-3">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-white/5 text-gray-300 hover:text-white"
                title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              >
                {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                <span className="text-sm font-medium">{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
              </button>

              <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-gray-300">
                  {userRole === 'umum' ? <Users size={20} /> : <UserCog size={20} />}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {userRole === 'umum' ? 'Mode Umum' : 'Mode Atasan'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {userRole === 'umum' ? 'Akses Terbatas' : 'Akses Penuh'}
                  </div>
                </div>
              </div>
              {userRole === 'umum' ? (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-[#12523f] hover:bg-[#16644d] text-white py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogIn size={16} />
                  Login Atasan
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setUserRole('umum');
                    setLoggedInName('');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 hover:text-red-200 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </div>
          </aside>

          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <header className={`h-14 flex items-center justify-between px-4 lg:px-6 z-10 bg-transparent`}>
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                  <Menu size={20} />
                </button>
                
              </div>

              <div className="flex items-center gap-2 sm:gap-4">

                {(pathname === '/' || pathname === '/backup' || pathname === '/status' || pathname === '/approval') && (
                  <div className="hidden lg:flex items-center gap-2 bg-transparent">
                    <div className={`flex items-center border rounded-md px-3 py-1.5 ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                      <span className="text-xs text-gray-400 mr-2 font-semibold">AWAL</span>
                      <input 
                        type="date" 
                        value={tempStartDate}
                        onChange={e => setTempStartDate(e.target.value)}
                        className={`text-sm bg-transparent border-none focus:outline-none ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
                      />
                    </div>
                    <div className={`flex items-center border rounded-md px-3 py-1.5 ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                      <span className="text-xs text-gray-400 mr-2 font-semibold">AKHIR</span>
                      <input 
                        type="date" 
                        value={tempEndDate}
                        onChange={e => setTempEndDate(e.target.value)}
                        className={`text-sm bg-transparent border-none focus:outline-none ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setStartDate(tempStartDate);
                        setEndDate(tempEndDate);
                      }}
                      className="bg-[#0c392c] hover:bg-[#082a20] text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                      Terapkan
                    </button>
                    <button 
                      onClick={() => {
                        setTempStartDate('');
                        setTempEndDate('');
                        setSearchQuery('');
                        setStartDate('');
                        setEndDate('');
                      }}
                      className={`flex items-center justify-center p-1.5 rounded-md border transition-colors ${isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-600'}`}
                      title="Reset Filter"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <div className="relative ml-2">
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={`pl-8 pr-4 py-1.5 border rounded-md text-sm focus:outline-none focus:border-[#0c392c] focus:ring-1 focus:ring-[#0c392c] ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                      />
                      <Search size={16} className={`absolute left-2.5 top-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    </div>
                  </div>
                )}
              </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-6 relative">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-[350px] max-w-[90vw] overflow-hidden flex flex-col items-center pt-8 pb-6 px-6 relative animate-in fade-in zoom-in duration-200">
            <div className="text-[#0c392c] mb-2">
              <Lock size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Login Atasan</h2>
            <p className="text-sm text-gray-500 mb-6">Masukkan kredensial Anda</p>
            
            <div className="w-full space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username (Nama)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-blue-50/50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c392c]/20 focus:border-[#0c392c] transition-all text-gray-900"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 bg-blue-50/50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c392c]/20 focus:border-[#0c392c] transition-all text-gray-900"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              
              {loginError && <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>}
              
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full flex justify-center items-center gap-2 bg-[#0c392c] hover:bg-[#082a20] text-white py-2.5 rounded-md font-semibold transition-colors mt-2"
              >
                {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                Masuk
              </button>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

