import os

files_to_update = [
    "src/app/page.tsx",
    "src/app/approval/page.tsx",
    "src/app/karyawan/page.tsx",
    "src/components/MainLayout.tsx"
]

for file in files_to_update:
    with open(file, "r", encoding="utf-8-sig") as f:
        content = f.read()
    
    content = content.replace('"/form"', '"/form-cuti-sakit"')
    content = content.replace("'/form'", "'/form-cuti-sakit'")
    
    with open(file, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Replacement done!")
