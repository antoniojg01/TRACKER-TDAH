#!/usr/bin/env node

/**
 * CRONOS - Verificação do vercel.json
 * Garante que todas as propriedades estão configuradas corretamente
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFICAÇÃO DO VERCEL.JSON\n');
console.log('='.repeat(60));

let errors = 0;
let warnings = 0;
let success = 0;

try {
  // Ler vercel.json
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

  console.log('\n✅ vercel.json encontrado e é um JSON válido');
  success++;

  // 1. Verificar propriedades base
  console.log('\n📋 1. PROPRIEDADES BASE:');
  
  const baseProps = ['version', 'name', 'buildCommand', 'outputDirectory', 'framework'];
  baseProps.forEach(prop => {
    if (vercelConfig[prop]) {
      console.log(`  ✅ ${prop}: "${vercelConfig[prop]}"`);
      success++;
    } else {
      console.log(`  ❌ ${prop}: AUSENTE`);
      errors++;
    }
  });

  // 2. Verificar framework
  console.log('\n🛠️  2. FRAMEWORK:');
  if (vercelConfig.framework === 'vite') {
    console.log('  ✅ Framework "vite" configurado corretamente');
    success++;
  } else {
    console.log(`  ⚠️  Framework é "${vercelConfig.framework}" (esperado: "vite")`);
    warnings++;
  }

  // 3. Verificar outputDirectory
  console.log('\n📁 3. OUTPUT DIRECTORY:');
  if (vercelConfig.outputDirectory === 'dist') {
    console.log('  ✅ outputDirectory "dist" correto para Vite');
    success++;
  } else {
    console.log(`  ⚠️  outputDirectory é "${vercelConfig.outputDirectory}" (esperado: "dist")`);
    warnings++;
  }

  // 4. Verificar rewrites (SPA)
  console.log('\n🔄 4. REWRITES (SPA Support):');
  if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
    console.log(`  ✅ ${vercelConfig.rewrites.length} rewrite(s) configurado(s)`);
    
    const hasCatchAll = vercelConfig.rewrites.some(r => 
      r.destination === '/index.html' || r.destination === 'index.html'
    );
    
    if (hasCatchAll) {
      console.log('  ✅ Catch-all para index.html configurado (React Router funcionará)');
      success++;
    } else {
      console.log('  ⚠️  Catch-all para index.html não encontrado');
      warnings++;
    }
  } else {
    console.log('  ❌ Nenhum rewrite configurado (React Router pode não funcionar)');
    errors++;
  }

  // 5. Verificar routes
  console.log('\n🛣️  5. ROUTES:');
  if (vercelConfig.routes && vercelConfig.routes.length > 0) {
    console.log(`  ✅ ${vercelConfig.routes.length} route(s) configurada(s)`);
    
    // Verificar se tem route para assets
    const hasAssetsRoute = vercelConfig.routes.some(r => 
      r.src && r.src.includes('assets')
    );
    
    if (hasAssetsRoute) {
      console.log('  ✅ Route para /assets/ configurada (cache otimizado)');
      success++;
    } else {
      console.log('  ⚠️  Route para /assets/ não encontrada');
      warnings++;
    }

    // Verificar catch-all route
    const hasCatchAllRoute = vercelConfig.routes.some(r => 
      r.dest === '/index.html' || r.dest === 'index.html'
    );
    
    if (hasCatchAllRoute) {
      console.log('  ✅ Catch-all route configurada');
      success++;
    } else {
      console.log('  ⚠️  Catch-all route não encontrada');
      warnings++;
    }
  } else {
    console.log('  ⚠️  Nenhuma route configurada');
    warnings++;
  }

  // 6. Verificar headers
  console.log('\n🔒 6. HEADERS (Segurança e Performance):');
  if (vercelConfig.headers && vercelConfig.headers.length > 0) {
    console.log(`  ✅ ${vercelConfig.headers.length} grupo(s) de headers configurado(s)`);
    success++;

    // Verificar headers de segurança importantes
    const allHeaders = vercelConfig.headers.flatMap(h => 
      h.headers ? h.headers.map(hh => hh.key) : []
    );

    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy',
      'Strict-Transport-Security'
    ];

    console.log('  \n  Headers de Segurança:');
    securityHeaders.forEach(header => {
      if (allHeaders.includes(header)) {
        console.log(`    ✅ ${header}`);
        success++;
      } else {
        console.log(`    ⚠️  ${header} não encontrado`);
        warnings++;
      }
    });

    // Verificar Cache-Control
    const hasCacheControl = allHeaders.includes('Cache-Control');
    if (hasCacheControl) {
      console.log('  \n  ✅ Cache-Control configurado (performance otimizada)');
      success++;
    } else {
      console.log('  \n  ⚠️  Cache-Control não configurado');
      warnings++;
    }
  } else {
    console.log('  ❌ Nenhum header configurado (segurança comprometida)');
    errors++;
  }

  // 7. Verificar variáveis de ambiente
  console.log('\n🌍 7. ENVIRONMENT VARIABLES:');
  if (vercelConfig.env) {
    const envVars = Object.keys(vercelConfig.env);
    console.log(`  ✅ ${envVars.length} variável(is) de ambiente configurada(s)`);
    
    const firebaseVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    console.log('  \n  Variáveis Firebase:');
    firebaseVars.forEach(v => {
      if (vercelConfig.env[v]) {
        console.log(`    ✅ ${v}`);
        success++;
      } else {
        console.log(`    ⚠️  ${v} não configurado`);
        warnings++;
      }
    });
  } else {
    console.log('  ⚠️  Nenhuma variável de ambiente configurada');
    warnings++;
  }

  // 8. Verificar build.env
  console.log('\n🔨 8. BUILD ENVIRONMENT:');
  if (vercelConfig.build && vercelConfig.build.env) {
    const buildEnvVars = Object.keys(vercelConfig.build.env);
    console.log(`  ✅ ${buildEnvVars.length} variável(is) de build configurada(s)`);
    
    if (vercelConfig.build.env.NODE_ENV === 'production') {
      console.log('  ✅ NODE_ENV=production configurado');
      success++;
    } else {
      console.log('  ⚠️  NODE_ENV não é "production"');
      warnings++;
    }
  } else {
    console.log('  ⚠️  Build environment não configurado');
    warnings++;
  }

  // 9. Verificar regions
  console.log('\n🌎 9. REGIONS:');
  if (vercelConfig.regions && vercelConfig.regions.length > 0) {
    console.log(`  ✅ ${vercelConfig.regions.length} região(ões) configurada(s): ${vercelConfig.regions.join(', ')}`);
    success++;
  } else {
    console.log('  ⚠️  Nenhuma região configurada (usará padrão)');
    warnings++;
  }

  // 10. Verificar GitHub integration
  console.log('\n🔗 10. GITHUB INTEGRATION:');
  if (vercelConfig.github) {
    const ghEnabled = vercelConfig.github.enabled;
    const ghAutoAlias = vercelConfig.github.autoAlias;
    const ghAutoCancel = vercelConfig.github.autoJobCancelation;
    
    if (ghEnabled) {
      console.log('  ✅ GitHub integration habilitada');
      success++;
    }
    if (ghAutoAlias) {
      console.log('  ✅ Auto-alias habilitado');
      success++;
    }
    if (ghAutoCancel) {
      console.log('  ✅ Auto-cancelamento de jobs habilitado (economiza recursos)');
      success++;
    }
  } else {
    console.log('  ⚠️  GitHub integration não configurada');
    warnings++;
  }

  // 11. Verificar URL handling
  console.log('\n🔗 11. URL HANDLING:');
  if (vercelConfig.trailingSlash === false) {
    console.log('  ✅ trailingSlash: false (URLs sem barra final)');
    success++;
  }
  if (vercelConfig.cleanUrls === true) {
    console.log('  ✅ cleanUrls: true (URLs sem .html)');
    success++;
  }

  // 12. Verificar Content-Security-Policy
  console.log('\n🛡️  12. CONTENT SECURITY POLICY (CSP):');
  const cspHeader = vercelConfig.headers?.find(h => 
    h.headers?.some(hh => hh.key === 'Content-Security-Policy')
  );
  
  if (cspHeader) {
    const cspValue = cspHeader.headers.find(h => h.key === 'Content-Security-Policy').value;
    
    // Verificar diretivas importantes
    const requiredDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'connect-src',
      'img-src'
    ];

    console.log('  CSP Diretivas:');
    requiredDirectives.forEach(directive => {
      if (cspValue.includes(directive)) {
        console.log(`    ✅ ${directive}`);
        success++;
      } else {
        console.log(`    ⚠️  ${directive} não encontrado`);
        warnings++;
      }
    });

    // Verificar se Firebase está permitido
    if (cspValue.includes('firebaseio.com') || cspValue.includes('googleapis.com')) {
      console.log('  ✅ Firebase permitido no CSP');
      success++;
    } else {
      console.log('  ⚠️  Firebase pode não estar permitido no CSP');
      warnings++;
    }

    // Verificar se Tailwind CDN está permitido
    if (cspValue.includes('cdn.tailwindcss.com')) {
      console.log('  ✅ Tailwind CDN permitido no CSP');
      success++;
    } else {
      console.log('  ⚠️  Tailwind CDN pode não estar permitido no CSP');
      warnings++;
    }
  } else {
    console.log('  ⚠️  CSP não configurado (menor segurança)');
    warnings++;
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO:\n');
  console.log(`  ✅ Sucessos: ${success}`);
  console.log(`  ⚠️  Avisos: ${warnings}`);
  console.log(`  ❌ Erros: ${errors}`);

  if (errors === 0 && warnings === 0) {
    console.log('\n🎉 PERFEITO! vercel.json está 100% configurado!\n');
    console.log('✨ Todas as propriedades estão corretas');
    console.log('✨ Todas as funcionalidades serão mantidas no deploy');
    console.log('✨ Segurança maximizada');
    console.log('✨ Performance otimizada\n');
    process.exit(0);
  } else if (errors === 0) {
    console.log('\n✅ BOM! vercel.json está funcional\n');
    console.log(`⚠️  ${warnings} aviso(s) encontrado(s)`);
    console.log('💡 Revise os avisos, mas pode fazer deploy\n');
    process.exit(0);
  } else {
    console.log('\n❌ PROBLEMAS ENCONTRADOS!\n');
    console.log(`❌ ${errors} erro(s) crítico(s)`);
    console.log(`⚠️  ${warnings} aviso(s)`);
    console.log('🛑 Corrija os erros antes de fazer deploy!\n');
    process.exit(1);
  }

} catch (error) {
  console.log('\n❌ ERRO ao verificar vercel.json:');
  console.log(`   ${error.message}\n`);
  
  if (error.message.includes('no such file')) {
    console.log('💡 Crie o arquivo vercel.json na raiz do projeto\n');
  } else if (error.message.includes('JSON')) {
    console.log('💡 vercel.json contém JSON inválido\n');
    console.log('   Use um validador JSON: https://jsonlint.com\n');
  }
  
  process.exit(1);
}
