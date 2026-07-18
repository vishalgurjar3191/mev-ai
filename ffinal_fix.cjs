const fs = require('fs');
const path = require('path');

console.log("🛠️ Reverting chat bubble style and updating entry branding...");

// 1. Chat ke avatar ko pehle jaisa default default standard banana
const logoPath = path.join(process.cwd(), 'src', 'components', 'common', 'Logo.tsx');
if (fs.existsSync(logoPath)) {
    const originalLogoCode = `import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
        MEV AI
      </span>
    </div>
  );
};

export default Logo;`;

    fs.writeFileSync(logoPath, originalLogoCode, 'utf8');
    console.log("✅ Chat display logo restored to original standard layout.");
}

// 2. Open hote hi Main Landing Page ya Header screen par "by Vishal Gurjar" add karna
const landingHeroPath = path.join(process.cwd(), 'src', 'components', 'landing', 'Hero.tsx');
const layoutNavbarPath = path.join(process.cwd(), 'src', 'components', 'layout', 'Navbar.tsx');

// Target checking function for safety
let targetPath = fs.existsSync(landingHeroPath) ? landingHeroPath : (fs.existsSync(layoutNavbarPath) ? layoutNavbarPath : null);

if (targetPath) {
    let content = fs.readFileSync(targetPath, 'utf8');
    // Injecting entry branding logic safely if present
    if (content.includes("MEV AI") && !content.includes("by Vishal Gurjar")) {
        content = content.replace("MEV AI", "MEV AI\\n<span className='text-xs block text-slate-400 font-normal tracking-wider'>by Vishal Gurjar</span>");
        fs.writeFileSync(targetPath, content, 'utf8');
        console.log("✅ Branding successfully added to the main entry/open view interface.");
    }
} else {
    console.log("⚠️ Entry component placeholder not modified dynamically.");
}

console.log("🎉 All changes applied seamlessly! Restart using npm run dev");
