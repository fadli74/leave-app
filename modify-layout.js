const fs = require('fs');
const path = require('path');

const file = path.join('c:\\Users\\ljrnb\\Desktop\\Form Cuti dan sakit\\leave-app\\src\\components\\MainLayout.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Change aside class
content = content.replace(
  /<aside className=\{\`\$\{sidebarOpen \? 'w-64' : 'w-0 -translate-x-full'\} transition-all duration-300 \$\{isDarkMode \? 'bg-gray-950 border-r border-gray-800' : 'bg-\[#0c392c\]'\} text-gray-300 flex flex-col fixed md:relative z-20 h-full overflow-hidden\`\}>/,
  "<aside className={`" + "${sidebarOpen ? 'w-64' : 'w-[72px]'} transition-all duration-300 " + "${isDarkMode ? 'bg-gray-950 border-r border-gray-800' : 'bg-[#0c392c]'} text-gray-300 flex flex-col z-20 h-full overflow-hidden shrink-0`}>"
);

// 2. Change the header text to show just icon/short text when closed
content = content.replace(
  /<div className="p-5 text-white font-bold text-xl border-b border-white\/10 truncate flex justify-between items-center">\s*<span>CL - LEAVE APP<\/span>\s*<button onClick=\{\(\) => setSidebarOpen\(false\)\} className="md:hidden text-gray-300 hover:text-white">\s*<X size=\{20\} \/>\s*<\/button>\s*<\/div>/g,
  `<div className="p-5 text-white font-bold text-xl border-b border-white/10 truncate flex justify-between items-center h-[73px]">
    <span>{sidebarOpen ? 'CL - LEAVE APP' : 'CL'}</span>
  </div>`
);
content = content.replace(
  /<div className="p-5 text-white font-bold text-xl border-b border-white\/10 truncate flex justify-between items-center">\s*<span>CL - LEAVE APP<\/span>\s*<button onClick=\{\(\) => setSidebarOpen\(false\)\} className="md:hidden text-gray-300 hover:text-white">\s*.\s*<\/button>\s*<\/div>/g,
  `<div className="p-5 text-white font-bold text-xl border-b border-white/10 truncate flex justify-between items-center h-[73px]">
    <span className="truncate">{sidebarOpen ? 'CL - LEAVE APP' : 'CL'}</span>
  </div>`
);

// 3. Make all spans inside Links hidden if sidebar is closed
content = content.replace(
  /<span className="text-sm font-medium">([^<]+)<\/span>/g,
  '<span className={`text-sm font-medium transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>$1</span>'
);

// 4. Update the bottom profile section
content = content.replace(
  /<div className="mt-auto border-t border-white\/10 p-4">([\s\S]*?)<\/aside>/g,
  (match, inner) => {
    let replaced = inner.replace(/<span className="text-sm font-medium">/g, '<span className={`text-sm font-medium transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>');
    replaced = replaced.replace(/<div className="text-sm font-bold text-white truncate">/g, '<div className={`text-sm font-bold text-white truncate ${sidebarOpen ? "block" : "hidden"}`}>');
    replaced = replaced.replace(/<div className="text-xs text-gray-400">/g, '<div className={`text-xs text-gray-400 ${sidebarOpen ? "block" : "hidden"}`}>');
    // Hide the login/logout text
    replaced = replaced.replace(/Login Atasan<\/button>/g, '{sidebarOpen && "Login Atasan"}</button>');
    replaced = replaced.replace(/Logout<\/button>/g, '{sidebarOpen && "Logout"}</button>');
    return `<div className="mt-auto border-t border-white/10 p-4 flex flex-col gap-4">${replaced}</aside>`;
  }
);


fs.writeFileSync(file, content);
console.log('Modified MainLayout.tsx successfully.');
