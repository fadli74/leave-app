import sys

with open("src/components/MainLayout.tsx", "r", encoding="utf-8-sig") as f:
    content = f.read()

old_text = "    <span className=\"truncate\">{sidebarOpen ? 'CL - LEAVE APP' : 'CL'}</span>"
new_text = "    <span className=\"truncate\">{sidebarOpen ? 'Form Cuti & Sakit' : 'Form'}</span>"

content = content.replace(old_text, new_text)

with open("src/components/MainLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print(f"Replaced: {old_text in content}")
