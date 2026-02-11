#!/usr/bin/env node

/**
 * CRONOS - Pre-Deploy Checklist
 * Verifica se tudo está configurado corretamente antes do deploy
 */

console.log('\n🔍 CRONOS - Verificação Pré-Deploy\n');
console.log('=' .repeat(50));

let errors = 0;
let warnings = 0;

// 1. Verificar variáveis de ambiente
console.log('\n📋 Verificando Variáveis de Ambiente...');
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.log(`❌ ${envVar} não configurada`);
    errors++;
  } else {
    console.log(`✅ ${envVar} configurada`);
  }
});

// 2. Verificar arquivos críticos
console.log('\n📁 Verificando Arquivos Críticos...');
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'package.json',
  'vite.config.ts',
  'vercel.json',
  'src/app/App.tsx',
  'src/services/firebaseConfig.ts',
  'src/services/firebaseService.ts',
  'index.html'
];

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} existe`);
  } else {
    console.log(`❌ ${file} não encontrado`);
    errors++;
  }
});

// 3. Verificar package.json
console.log('\n📦 Verificando package.json...');
const packageJson = require('../package.json');

if (packageJson.scripts && packageJson.scripts.build) {
  console.log('✅ Script "build" configurado');
} else {
  console.log('❌ Script "build" não encontrado');
  errors++;
}

if (packageJson.dependencies) {
  const criticalDeps = ['react', 'react-dom', 'firebase', 'lucide-react'];
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.peerDependencies?.[dep]) {
      console.log(`✅ Dependência "${dep}" presente`);
    } else {
      console.log(`⚠️  Dependência "${dep}" não encontrada`);
      warnings++;
    }
  });
}

// 4. Verificar configuração do Vercel
console.log('\n🌐 Verificando Configuração Vercel...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.framework === 'vite') {
    console.log('✅ Framework "vite" configurado');
  } else {
    console.log('⚠️  Framework não é "vite"');
    warnings++;
  }
  
  if (vercelConfig.buildCommand) {
    console.log('✅ Build command configurado');
  }
  
  if (vercelConfig.rewrites) {
    console.log('✅ Rewrites configurados (SPA)');
  } else {
    console.log('⚠️  Rewrites não configurados');
    warnings++;
  }
} catch (error) {
  console.log('❌ Erro ao ler vercel.json');
  errors++;
}

// 5. Verificar Firebase Config
console.log('\n🔥 Verificando Firebase Config...');
try {
  const firebaseConfigPath = path.join(process.cwd(), 'src/services/firebaseConfig.ts');
  const firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');
  
  if (firebaseConfig.includes('initializeApp')) {
    console.log('✅ Firebase inicializado corretamente');
  } else {
    console.log('❌ Firebase não inicializado');
    errors++;
  }
  
  if (firebaseConfig.includes('getFirestore')) {
    console.log('✅ Firestore configurado');
  } else {
    console.log('⚠️  Firestore pode não estar configurado');
    warnings++;
  }
} catch (error) {
  console.log('❌ Erro ao verificar Firebase config');
  errors++;
}

// 6. Resumo Final
console.log('\n' + '=' .repeat(50));
console.log('\n📊 RESUMO:\n');

if (errors === 0 && warnings === 0) {
  console.log('🎉 Tudo perfeito! Pronto para deploy! 🚀');
  console.log('\n✨ Execute: npm run build');
  console.log('✨ Depois: vercel --prod');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  ${warnings} aviso(s) encontrado(s)`);
  console.log('✅ Pode fazer deploy, mas revise os avisos');
  process.exit(0);
} else {
  console.log(`❌ ${errors} erro(s) crítico(s) encontrado(s)`);
  console.log(`⚠️  ${warnings} aviso(s) encontrado(s)`);
  console.log('\n🛑 Corrija os erros antes de fazer deploy!');
  process.exit(1);
}
