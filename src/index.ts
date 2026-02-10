import { BoletosService } from './services/boletos.service';
import { ItauConfig } from './config/itau.config';
import clientesData from './data/clientes.json';
import { Cliente } from './types';

/**
 * Arquivo principal demonstrando o fluxo completo de integração
 * 
 * Fluxo:
 * 1. Valida credenciais
 * 2. Gera tokens necessários
 * 3. Faz requisições autenticadas à API
 */
async function main() {
  console.log('🚀 Iniciando aplicação Boletos Itaú\n');
  console.log('=' .repeat(60));
  
  try {
    // Exibe configurações (sem expor secrets)
    console.log('\n📋 Configurações:');
    console.log(`   Sandbox URL: ${ItauConfig.sandboxUrl}`);
    console.log(`   OAuth URL: ${ItauConfig.oauthUrl}`);
    console.log(`   Client ID: ${ItauConfig.clientId.substring(0, 8)}...`);
    console.log('');

    // Inicializa o serviço de boletos
    const boletosService = new BoletosService();

    // AÇÃO 1: Valida credenciais (resolve API Key automaticamente usando CLIENT_ID)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AÇÃO 1: Validando Credenciais (resolvendo API Key automaticamente)...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   🔄 Resolvendo API Key automaticamente usando CLIENT_ID...');
    console.log('');
    
    const credenciais = await boletosService.validarCredenciais(true); // true = resolve automaticamente
    console.log('   ✓ CLIENT_ID:', credenciais.clientId ? '✅ Configurado' : '❌ Não configurado');
    console.log('   ✓ CLIENT_SECRET:', credenciais.clientSecret ? '✅ Configurado' : '❌ Não configurado');
    console.log('   ✓ API_KEY:', credenciais.apiKey ? '✅ Resolvida automaticamente' : '❌ Não resolvida');
    
    if (credenciais.apiKey) {
      console.log(`   💡 API Key resolvida: ${ItauConfig.apiKey.substring(0, 10)}... (usando CLIENT_ID)`);
    }
    
    console.log('   Status geral:', credenciais.todasValidadas ? '✅ Todas validadas' : '❌ Faltando credenciais');
    console.log('');

    // AÇÃO 2: Gera tokens necessários
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AÇÃO 2: Gerando Tokens Necessários...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const tokens = await boletosService.gerarTokens();
    console.log('   ✓ Token OAuth:', tokens.oauthToken.substring(0, 30) + '...');
    console.log('   ✓ API Key:', tokens.apiKey.substring(0, 10) + '...');
    console.log('   ✓ Correlation ID:', tokens.correlationId);
    console.log('   ✓ Headers preparados:', '✅ Prontos para uso');
    console.log('');

    // AÇÃO 3: Pronto para fazer requisições autenticadas
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AÇÃO 3: Sistema Pronto para Requisições Autenticadas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📤 Exemplo de uso:');
    console.log('');
    console.log('   // Criar um boleto');
    console.log('   const boleto = await boletosService.criarBoleto({');
    console.log('     clienteId: "123",');
    console.log('     valor: 100.50,');
    console.log('     dataVencimento: "2026-02-20",');
    console.log('     descricao: "Pagamento de serviços"');
    console.log('   });');
    console.log('');
    console.log('   // Consultar um boleto');
    console.log('   const boletoConsultado = await boletosService.consultarBoleto("123456");');
    console.log('');
    console.log('   // Requisição customizada');
    console.log('   const resultado = await boletosService.requisicaoAutenticada(');
    console.log('     "GET",');
    console.log('     "/boletos"');
    console.log('   );');
    console.log('');

    // Status do serviço
    const status = boletosService.getStatus();
    console.log('📊 Status do Serviço:');
    console.log(`   Inicializado: ${status.initialized ? '✅' : '❌'}`);
    console.log(`   Token OAuth em cache: ${status.hasOAuthToken ? '✅' : '❌'}`);
    if (status.oauthTokenExpiresAt) {
      console.log(`   Token expira em: ${status.oauthTokenExpiresAt.toLocaleString('pt-BR')}`);
    }
    console.log('');

    // Exibe informações sobre os clientes fictícios
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 Clientes Disponíveis para Testes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const clientes: Cliente[] = clientesData as Cliente[];
    clientes.forEach((cliente, index) => {
      console.log(`\n   ${index + 1}. ${cliente.nome} (${cliente.tipo})`);
      console.log(`      ID: ${cliente.id}`);
      console.log(`      Documento: ${cliente.documento}`);
      console.log(`      Email: ${cliente.email}`);
      console.log(`      Cidade: ${cliente.endereco.cidade}/${cliente.endereco.estado}`);
    });
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Sistema configurado e pronto para uso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

  } catch (error) {
    console.error('\n❌ Erro:', error instanceof Error ? error.message : error);
    console.log('\n💡 Verifique:');
    console.log('   1. Se todas as credenciais estão configuradas no arquivo .env');
    console.log('   2. Se as credenciais estão corretas');
    console.log('   3. Se há conexão com a internet');
    process.exit(1);
  }
}

// Executa a aplicação
if (require.main === module) {
  main();
}
