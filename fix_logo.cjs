const fs = require('fs');
const path = require('path');

const logoPath = path.join(process.cwd(), 'src', 'components', 'common', 'Logo.tsx');

if (fs.existsSync(logoPath)) {
    const defaultLogoCode = `import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex flex-col items-start">
      <span className="text-xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
        MEV AI
      </span>
      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
        by Vishal Gurjar
      </span>
    </div>
  );
};

export default Logo;`;

    fs.writeFileSync(logoPath, defaultLogoCode, 'utf8');
    console.log("✅ Logo export issue fixed completely!");
} else {
    console.log("❌ Logo file not found!");
}
