import { AuthService } from '../services/auth.service';
import { ItauConfig, validateConfig, validateApiKey } from '../config/itau.config';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Script de teste para gerar tokens e demonstrar como fazer requisições à API de boletos
 */
async function testTokens() {
  console.log('🧪 Teste de Geração de Tokens - API Boletos Itaú\n');
  console.log('=' .repeat(60));
  
  try {
    // Valida configurações básicas
    console.log('\n📋 Validando configurações...');
    validateConfig();
    console.log('✅ Configurações básicas validadas');
    console.log(`   Client ID: ${ItauConfig.clientId.substring(0, 8)}...`);
    console.log(`   Sandbox URL: ${ItauConfig.sandboxUrl}`);
    console.log(`   OAuth URL: ${ItauConfig.oauthUrl}`);

    // 1. Gerar Token OAuth
    console.log('\n🔐 Passo 1: Gerando Token OAuth...');
    const authService = new AuthService();
    const oauthToken = await authService.getAccessToken();
    
    console.log('✅ Token OAuth gerado com sucesso!');
    console.log(`   Token: ${oauthToken.substring(0, 30)}...`);
    
    const cacheInfo = authService.getCacheInfo();
    if (cacheInfo.expiresAt) {
      const expiresDate = new Date(cacheInfo.expiresAt);
      console.log(`   Expira em: ${expiresDate.toLocaleString('pt-BR')}`);
    }

    // 2. Validar API Key
    console.log('\n🔑 Passo 2: Validando API Key...');
    try {
      validateApiKey();
      console.log('✅ API Key configurada');
      console.log(`   API Key: ${ItauConfig.apiKey.substring(0, 10)}...`);
    } catch (error) {
      console.log('⚠️  API Key não configurada');
      console.log('   Para obter sua API Key:');
      console.log('   1. Acesse https://devportal.itau.com.br');
      console.log('   2. Faça login ou crie uma conta');
      console.log('   3. Navegue até "Minhas Aplicações"');
      console.log('   4. Selecione sua aplicação');
      console.log('   5. Copie a API Key e adicione ao arquivo .env como ITAU_API_KEY');
      console.log('\n   Continuando sem API Key para demonstração...');
    }

    // 3. Gerar Correlation ID
    console.log('\n🆔 Passo 3: Gerando Correlation ID...');
    const correlationId = uuidv4();
    console.log('✅ Correlation ID gerado');
    console.log(`   Correlation ID: ${correlationId}`);

    // 4. Demonstrar estrutura de requisição
    console.log('\n📤 Passo 4: Estrutura de Requisição para POST /boletos');
    console.log('=' .repeat(60));
    console.log('\nHeaders necessários:');
    console.log('  Authorization: Bearer <token_oauth>');
    console.log('  x-itau-apikey: <sua_api_key>');
    console.log('  x-itau-correlationID: <correlation_id>');
    console.log('  Content-Type: application/json');
    
    console.log('\nExemplo de requisição:');
    console.log(JSON.stringify({
      method: 'POST',
      url: `${ItauConfig.sandboxUrl}/boletos`,
      headers: {
        'Authorization': `Bearer ${oauthToken.substring(0, 20)}...`,
        'x-itau-apikey': ItauConfig.apiKey || '<sua_api_key_aqui>',
        'x-itau-correlationID': correlationId,
        'Content-Type': 'application/json'
      },
      body: {
        // Exemplo de payload para criação de boleto
        // (ajuste conforme documentação da API)
      }
    }, null, 2));

    // 5. Documentação completa das chaves
    console.log('\n📝 DOCUMENTAÇÃO COMPLETA DAS CHAVES NECESSÁRIAS:');
    console.log('=' .repeat(60));
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣  TOKEN OAUTH (access_token)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Status: ✅ Gerado automaticamente');
    console.log('   Valor completo: ' + oauthToken);
    console.log('   Valor (preview): ' + oauthToken.substring(0, 30) + '...');
    console.log('   Header HTTP: Authorization: Bearer ' + oauthToken);
    console.log('   Tipo: OAuth 2.0 access_token');
    console.log('   Validade: 300 segundos (5 minutos)');
    if (cacheInfo.expiresAt) {
      const expiresDate = new Date(cacheInfo.expiresAt);
      console.log('   Expira em: ' + expiresDate.toLocaleString('pt-BR'));
    }
    console.log('   Como obter: Gerado automaticamente via OAuth usando CLIENT_ID e CLIENT_SECRET');
    console.log('   Onde usar: Todas as requisições autenticadas à API');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  X-ITAU-APIKEY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (ItauConfig.apiKey) {
      console.log('   Status: ✅ Configurado');
      console.log('   Valor completo: ' + ItauConfig.apiKey);
      console.log('   Valor (preview): ' + ItauConfig.apiKey.substring(0, 10) + '...');
      console.log('   Header HTTP: x-itau-apikey: ' + ItauConfig.apiKey);
    } else {
      console.log('   Status: ❌ NÃO CONFIGURADO');
      console.log('   Valor completo: <não configurado>');
      console.log('   Header HTTP: x-itau-apikey: <sua_api_key_aqui>');
    }
    console.log('   Tipo: String (API Key)');
    console.log('   Obrigatório: ⚠️  SIM (obrigatório para requisições à API de boletos)');
    console.log('   Como obter:');
    console.log('      1. Acesse https://devportal.itau.com.br');
    console.log('      2. Faça login ou crie uma conta');
    console.log('      3. Navegue até "Sandbox" ou "Minhas Aplicações"');
    console.log('      4. Selecione sua aplicação');
    console.log('      5. Copie a API Key');
    console.log('      6. Adicione ao arquivo .env como: ITAU_API_KEY=sua_api_key_aqui');
    console.log('   Onde usar: Todas as requisições à API de boletos');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣  X-ITAU-CORRELATIONID');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Status: ✅ Gerado automaticamente');
    console.log('   Valor completo: ' + correlationId);
    console.log('   Header HTTP: x-itau-correlationID: ' + correlationId);
    console.log('   Tipo: UUID v4');
    console.log('   Obrigatório: ✅ SIM');
    console.log('   Formato: UUID v4 (ex: ' + correlationId + ')');
    console.log('   Como obter: Gerado automaticamente pelo script (use biblioteca uuid)');
    console.log('   Importante: Deve ser ÚNICO para cada requisição');
    console.log('   Onde usar: Todas as requisições à API de boletos');
    console.log('   💡 Dica: Gere um novo UUID para cada requisição usando: uuidv4()');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMO PARA USO NAS REQUISIÇÕES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nExemplo de requisição HTTP completa:\n');
    console.log('POST ' + ItauConfig.sandboxUrl + '/boletos');
    console.log('Headers:');
    console.log('  Authorization: Bearer ' + oauthToken);
    console.log('  x-itau-apikey: ' + (ItauConfig.apiKey || '<sua_api_key_aqui>'));
    console.log('  x-itau-correlationID: ' + correlationId);
    console.log('  Content-Type: application/json');
    console.log('\nExemplo em código TypeScript/Axios:\n');
    console.log('const response = await axios.post(');
    console.log('  "' + ItauConfig.sandboxUrl + '/boletos",');
    console.log('  { /* dados do boleto */ },');
    console.log('  {');
    console.log('    headers: {');
    console.log('      "Authorization": "Bearer ' + oauthToken + '",');
    console.log('      "x-itau-apikey": "' + (ItauConfig.apiKey || '<sua_api_key_aqui>') + '",');
    console.log('      "x-itau-correlationID": "' + correlationId + '",');
    console.log('      "Content-Type": "application/json"');
    console.log('    }');
    console.log('  }');
    console.log(');');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ Teste concluído com sucesso!');
    console.log('\n📚 Próximos passos:');
    if (!ItauConfig.apiKey) {
      console.log('   ⚠️  1. Configure ITAU_API_KEY no arquivo .env (OBRIGATÓRIO)');
      console.log('   ✅ 2. Use os tokens documentados acima nas requisições à API');
      console.log('   ✅ 3. Implemente o serviço de boletos com esses headers');
    } else {
      console.log('   ✅ Todas as chaves estão configuradas!');
      console.log('   ✅ Use os tokens documentados acima nas requisições à API');
      console.log('   ✅ Implemente o serviço de boletos com esses headers');
    }
    console.log('\n📄 Todas as chaves foram documentadas acima. Copie e use conforme necessário.');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Executa o teste
if (require.main === module) {
  testTokens();
}
