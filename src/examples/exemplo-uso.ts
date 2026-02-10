import { BoletosService } from '../services/boletos.service';
import { DadosBoleto } from '../types';

/**
 * Exemplo completo de uso do BoletosService
 * 
 * Este exemplo demonstra o fluxo completo:
 * 1. Valida credenciais
 * 2. Gera tokens necessários
 * 3. Faz requisições autenticadas à API
 */
async function exemploUso() {
  console.log('📚 Exemplo de Uso do BoletosService\n');

  try {
    // Inicializa o serviço
    const boletosService = new BoletosService();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AÇÃO 1: Validar Credenciais
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('1️⃣  Validando credenciais...');
    const credenciais = await boletosService.validarCredenciais();
    
    if (credenciais.todasValidadas) {
      console.log('✅ Todas as credenciais estão válidas!');
      console.log('   💡 API Key foi resolvida automaticamente usando CLIENT_ID\n');
    } else {
      console.log('❌ Algumas credenciais estão faltando');
      console.log('   CLIENT_ID:', credenciais.clientId ? '✅' : '❌');
      console.log('   CLIENT_SECRET:', credenciais.clientSecret ? '✅' : '❌');
      console.log('   API_KEY:', credenciais.apiKey ? '✅' : '❌');
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AÇÃO 2: Gerar Tokens
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('2️⃣  Gerando tokens necessários...');
    const tokens = await boletosService.gerarTokens();
    console.log('✅ Tokens gerados com sucesso!');
    console.log(`   OAuth Token: ${tokens.oauthToken.substring(0, 30)}...`);
    console.log(`   API Key: ${tokens.apiKey.substring(0, 10)}...`);
    console.log(`   Correlation ID: ${tokens.correlationId}\n`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AÇÃO 3: Fazer Requisições Autenticadas
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('3️⃣  Fazendo requisições autenticadas...\n');

    // Exemplo 1: Criar um boleto
    console.log('   📝 Exemplo 1: Criar um boleto');
    const dadosBoleto: DadosBoleto = {
      clienteId: '123',
      valor: 150.75,
      dataVencimento: '2026-02-20',
      descricao: 'Pagamento de serviços',
      numeroDocumento: 'DOC-001',
      instrucoes: ['Não receber após o vencimento'],
    };

    try {
      // Descomente a linha abaixo quando a API estiver configurada
      // const boletoCriado = await boletosService.criarBoleto(dadosBoleto);
      // console.log('   ✅ Boleto criado:', boletoCriado);
      console.log('   ⚠️  Requisição comentada (descomente para testar)');
    } catch (error) {
      console.log('   ❌ Erro ao criar boleto:', error instanceof Error ? error.message : error);
    }
    console.log('');

    // Exemplo 2: Consultar um boleto
    console.log('   🔍 Exemplo 2: Consultar um boleto');
    try {
      // Descomente a linha abaixo quando a API estiver configurada
      // const boletoConsultado = await boletosService.consultarBoleto('123456');
      // console.log('   ✅ Boleto consultado:', boletoConsultado);
      console.log('   ⚠️  Requisição comentada (descomente para testar)');
    } catch (error) {
      console.log('   ❌ Erro ao consultar boleto:', error instanceof Error ? error.message : error);
    }
    console.log('');

    // Exemplo 3: Requisição customizada
    console.log('   🔧 Exemplo 3: Requisição customizada');
    try {
      // Descomente as linhas abaixo quando a API estiver configurada
      // const resultado = await boletosService.requisicaoAutenticada(
      //   'GET',
      //   '/boletos',
      //   undefined,
      //   'meu-correlation-id-customizado'
      // );
      // console.log('   ✅ Resultado:', resultado);
      console.log('   ⚠️  Requisição comentada (descomente para testar)');
    } catch (error) {
      console.log('   ❌ Erro na requisição:', error instanceof Error ? error.message : error);
    }
    console.log('');

    // Status do serviço
    console.log('📊 Status do Serviço:');
    const status = boletosService.getStatus();
    console.log(`   Inicializado: ${status.initialized ? '✅' : '❌'}`);
    console.log(`   Token OAuth em cache: ${status.hasOAuthToken ? '✅' : '❌'}`);
    if (status.oauthTokenExpiresAt) {
      console.log(`   Token expira em: ${status.oauthTokenExpiresAt.toLocaleString('pt-BR')}`);
    }

    console.log('\n✨ Exemplo concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro no exemplo:', error instanceof Error ? error.message : error);
  }
}

// Executa o exemplo se chamado diretamente
if (require.main === module) {
  exemploUso();
}
