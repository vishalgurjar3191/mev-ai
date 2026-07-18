const fs = require('fs');
const path = require('path');

console.log("🚀 Starting MEV AI Brand Transformation...");

// 1. Tailwind Config Update (For Theme Support)
const tailwindPath = path.join(process.cwd(), 'tailwind.config.ts');
if (fs.existsSync(tailwindPath)) {
    let content = fs.readFileSync(tailwindPath, 'utf8');
    if (!content.includes("darkMode: 'class'")) {
        content = content.replace(/export default\s*{/, "export default {\n  darkMode: 'class',");
        fs.writeFileSync(tailwindPath, content, 'utf8');
        console.log("✅ Theme configurations added to Tailwind.");
    }
}

// 2. CSS Inject for Light/Dark Switch
const cssPath = path.join(process.cwd(), 'src', 'index.css');
if (fs.existsSync(cssPath)) {
    const themeCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-white text-slate-900 transition-colors duration-200;
}
.dark body {
  @apply bg-[#0f172a] text-slate-100;
}`;
    fs.writeFileSync(cssPath, themeCSS, 'utf8');
    console.log("✅ CSS global styles injected successfully.");
}

// 3. Brand UI Signature Inject ("by Vishal Gurjar")
const logoPath = path.join(process.cwd(), 'src', 'components', 'common', 'Logo.tsx');
if (fs.existsSync(logoPath)) {
    const logoCode = `import React from 'react';

export const Logo: React.FC = () => {
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
};`;
    fs.writeFileSync(logoPath, logoCode, 'utf8');
    console.log("✅ Dynamic branding signature applied.");
}

// 4. Vite Host Config for Termux Localhost fix
const vitePath = path.join(process.cwd(), 'vite.config.ts');
if (fs.existsSync(vitePath)) {
    const viteCode = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true
  }
})`;
    fs.writeFileSync(vitePath, viteCode, 'utf8');
    console.log("✅ Network routing optimized for Termux.");
}

console.log("🎉 All changes applied seamlessly! Now type: npm run dev");
