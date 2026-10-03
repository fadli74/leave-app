import sys
import re

with open("src/components/MainLayout.tsx", "r", encoding="utf-8-sig") as f:
    content = f.read()

content = re.sub(
    r'<div className="p-5 text-white font-bold text-xl border-b border-white/10 truncate flex justify-between items-center h-\[73px\]">\s*<span className="truncate">\{sidebarOpen \? \'Form Cuti & Sakit\' \: \'Form\'\}</span>\s*</div>',
    """<div className={`py-5 text-white font-bold text-xl border-b border-white/10 flex items-center h-[73px] ${sidebarOpen ? 'px-5 justify-between' : 'justify-center'}`}>
    <span className={sidebarOpen ? "truncate" : "text-sm"}>{sidebarOpen ? 'Form Cuti & Sakit' : 'Form'}</span>
    </div>""",
    content
)

with open("src/components/MainLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
