// DEBUG TEST - Run this in the browser console to test saving
// Copy and paste this entire function into the console and run: testSaveDebug()

window.testSaveDebug = function() {
  console.log('🧪 === TESTE DE SALVAMENTO DO CRONOS ===\n');
  
  // Test 1: Check localStorage
  console.log('📋 Test 1: Verificando localStorage...');
  const tasks = localStorage.getItem('cronos_tasks');
  const stats = localStorage.getItem('cronos_stats');
  const books = localStorage.getItem('cronos_books');
  const links = localStorage.getItem('cronos_links');
  
  console.log('📦 Tasks:', tasks ? `✅ ${JSON.parse(tasks).length} tarefas` : '❌ Vazio');
  console.log('⭐ Stats:', stats ? `✅ Level ${JSON.parse(stats).level}` : '❌ Vazio');
  console.log('📚 Books:', books ? `✅ ${JSON.parse(books).length} livros` : '❌ Vazio');
  console.log('🔗 Links:', links ? `✅ ${JSON.parse(links).length} links` : '❌ Vazio');
  
  // Test 2: Create a test task
  console.log('\n📋 Test 2: Criando tarefa de teste...');
  const testTask = {
    id: 'test-' + Date.now(),
    title: '🧪 TESTE DE SALVAMENTO',
    completed: false,
    priority: 3,
    category: 'WORK',
    type: 'DAILY',
    createdAt: Date.now()
  };
  
  const currentTasks = tasks ? JSON.parse(tasks) : [];
  currentTasks.push(testTask);
  localStorage.setItem('cronos_tasks', JSON.stringify(currentTasks));
  console.log('✅ Tarefa de teste criada:', testTask.title);
  console.log('✅ Salva no localStorage!');
  
  // Test 3: Verify it was saved
  console.log('\n📋 Test 3: Verificando se foi salvo...');
  const savedTasks = JSON.parse(localStorage.getItem('cronos_tasks'));
  const foundTask = savedTasks.find(t => t.id === testTask.id);
  if (foundTask) {
    console.log('✅ SUCESSO! Tarefa encontrada no localStorage');
    console.log('📦 Total de tarefas:', savedTasks.length);
  } else {
    console.log('❌ ERRO! Tarefa não foi salva');
  }
  
  // Test 4: Check all storage
  console.log('\n📊 Test 4: Resumo completo do armazenamento...');
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith('cronos_'));
  console.log('🔑 Chaves CRONOS encontradas:', allKeys);
  
  allKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    console.log(`  • ${key}: ${(size / 1024).toFixed(2)} KB`);
  });
  
  // Test 5: Total storage usage
  let totalSize = 0;
  for (let key in localStorage) {
    if (key.startsWith('cronos_')) {
      totalSize += localStorage.getItem(key).length;
    }
  }
  console.log(`\n💾 Tamanho total: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`📈 Limite do localStorage: ~5 MB (${((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2)}% usado)`);
  
  console.log('\n🧪 === TESTE COMPLETO ===');
  console.log('✅ localStorage está funcionando!');
  console.log('📝 Se você viu ✅ acima, o salvamento local está OK.');
  console.log('☁️ Para testar Supabase, clique no botão "Sync Cloud"');
  
  return {
    localStorage: 'OK',
    tasksCount: savedTasks.length,
    storageUsed: `${(totalSize / 1024).toFixed(2)} KB`
  };
};

console.log('✅ Função de teste carregada!');
console.log('📝 Execute: testSaveDebug()');
