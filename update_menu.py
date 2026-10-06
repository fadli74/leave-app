import sys

with open("src/components/MainLayout.tsx", "r", encoding="utf-8-sig") as f:
    content = f.read()

target = """                  <>
                    <li>
                      <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/approval" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/approval' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                        <CheckSquare size={20} />
                        <span className={`text-sm font-medium transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>Approval Atasan</span>
                      </Link>
                    </li>"""

replacement = """                  <>
                    <li>
                      <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/approval" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/approval' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                        <CheckSquare size={20} />
                        <span className={`text-sm font-medium transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>Approval Atasan</span>
                      </Link>
                    </li>
                    <li>
                      <Link onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} href="/approval-payment" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/approval-payment' ? 'bg-white/10 text-white border-l-4 border-emerald-400' : 'hover:bg-white/5 hover:text-white'}`}>
                        <Banknote size={20} />
                        <span className={`text-sm font-medium transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>Approval Payment</span>
                      </Link>
                    </li>"""

if target in content:
    content = content.replace(target, replacement)
    
    # Also need to import Banknote if not imported
    if "Banknote" not in content:
        content = content.replace("CheckSquare,", "CheckSquare, Banknote,")
        
    with open("src/components/MainLayout.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Not found")
