import sys
import re

with open("src/components/MainLayout.tsx", "r", encoding="utf-8-sig") as f:
    content = f.read()

# Insert before Daftar Karyawan Link
daftar_idx = content.find("href=\"/karyawan\"")
if daftar_idx != -1:
    li_start = content.rfind("<li>", 0, daftar_idx)
    
    new_li = """<li>
                      <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/approval-payment" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/approval-payment' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                        <span className={`text-sm font-medium transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>Approval Payment</span>
                      </Link>
                    </li>
                    """
    
    content = content[:li_start] + new_li + content[li_start:]
    
    with open("src/components/MainLayout.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced with regex!")
else:
    print("Not found")
