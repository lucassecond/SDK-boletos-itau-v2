import { BoletosService } from '../services/boletos.service';
import { BoletoBuilder } from '../utils/boleto-builder';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Teste: Gerar boleto no valor de R$15.162,12
 */
async function testeValor() {
  console.log('🧪 Teste: Gerar Boleto no valor de R$15.162,12\n');
  console.log('=' .repeat(60));

  try {
    // Inicializa o serviço
    const boletosService = new BoletosService();

    // Valida credenciais
    console.log('\n1️⃣  Validando credenciais...');
    const credenciais = await boletosService.validarCredenciais();
    
    if (!credenciais.todasValidadas) {
      console.log('❌ Credenciais não configuradas');
      return;
    }
    console.log('✅ Credenciais validadas');

    // Gera tokens
    console.log('\n2️⃣  Gerando tokens...');
    await boletosService.gerarTokens();
    console.log('✅ Tokens gerados');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Criar boleto com valor específico: R$15.162,12
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n3️⃣  Criando boleto no valor de R$15.162,12...\n');

    const beneficiario = BoletoBuilder.criarBeneficiario(
      '150000052061',
      'Antonio Coutinho SA',
      'J',
      undefined,
      '12345678901234',
      BoletoBuilder.criarEndereco(
        'rua dona ana neri, 368',
        'Mooca',
        'Sao Paulo',
        'SP',
        '12345678'
      )
    );

    const pagador = BoletoBuilder.criarPagador(
      'Antônio Coutinho',
      'J',
      undefined,
      '12345678901234',
      'itau@itau-unibanco.com.br',
      BoletoBuilder.criarEndereco(
        'rua dona ana neri, 368',
        'Mooca',
        'Sao Paulo',
        'SP',
        '12345678'
      ),
      'Empresa A'
    );

    const boleto = BoletoBuilder.criarBoletoCompleto({
      etapaProcesso: 'validacao',
      codigoCanalOperacao: 'API',
      beneficiario,
      pagador,
      nossoNumero: `TEST-${Date.now()}`,
      dataVencimento: '2026-02-20',
      valor: 15162.12, // R$15.162,12
      seuNumero: 'TEST-001',
      codigoCarteira: '109',
      codigoTipoVencimento: 1,
      codigoEspecie: '01',
      descricaoEspecie: 'Duplicata de Venda Mercantil',
      codigoAceite: 'S',
      dataEmissao: new Date().toISOString().split('T')[0],
    });

    console.log('📋 Dados do boleto (payload enviado):');
    const valorEnviado = boleto.dado_boleto.dados_individuais_boleto[0].valor_titulo;
    const valorEmReais = parseFloat(valorEnviado); // Já está em reais, não precisa dividir por 100
    console.log(`   Valor enviado (string): "${valorEnviado}"`);
    console.log(`   Valor em reais: R$ ${valorEmReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   Vencimento: ${boleto.dado_boleto.dados_individuais_boleto[0].data_vencimento}`);
    console.log(`   Nosso Número: ${boleto.dado_boleto.dados_individuais_boleto[0].numero_nosso_numero}`);
    console.log('\n📤 Payload completo sendo enviado:');
    console.log(JSON.stringify(boleto, null, 2).substring(0, 1500) + '...\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Criar boleto na API e gerar PDF
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('4️⃣  Enviando para API e gerando PDF...\n');

    const resposta = await boletosService.criarBoletoItau(boleto, undefined, true);
    
    console.log('✅ Boleto criado com sucesso!');
    
    if (resposta.dado_boleto?.dados_individuais_boleto?.[0]) {
      const boletoIndividual = resposta.dado_boleto.dados_individuais_boleto[0];
      console.log('\n📋 Informações do Boleto:');
      console.log(`   Nosso Número: ${boletoIndividual.numero_nosso_numero || 'N/A'}`);
      console.log(`   Linha Digitável: ${boletoIndividual.numero_linha_digitavel || boletoIndividual.linha_digitavel || 'N/A'}`);
      
      if (boletoIndividual.valor_titulo) {
        const valor = parseInt(boletoIndividual.valor_titulo) / 100;
        console.log(`   Valor: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      }
      
      console.log(`   Data Vencimento: ${boletoIndividual.data_vencimento || 'N/A'}`);
      console.log(`   Código de Barras: ${boletoIndividual.codigo_barras || 'N/A'}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Salvar PDF
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (resposta.pdf) {
      console.log('\n5️⃣  Salvando PDF...\n');
      
      const timestamp = Date.now();
      const caminhoPDF = path.join(process.cwd(), 'boletos', `boleto-${timestamp}.pdf`);
      
      // Cria diretório se não existir
      const diretorioPDF = path.dirname(caminhoPDF);
      if (!fs.existsSync(diretorioPDF)) {
        fs.mkdirSync(diretorioPDF, { recursive: true });
      }

      fs.writeFileSync(caminhoPDF, resposta.pdf);
      
      console.log(`✅ PDF gerado e salvo!`);
      console.log(`   📄 Arquivo: ${caminhoPDF}`);
      console.log(`   📊 Tamanho: ${(resposta.pdf.length / 1024).toFixed(2)} KB`);
      console.log(`   💰 Valor no PDF: R$ 15.162,12`);
    } else {
      console.log('\n⚠️  PDF não foi gerado automaticamente');
      console.log('   Tentando gerar manualmente...\n');
      
      const pdfBuffer = await boletosService.gerarPDFBoleto(resposta);
      const caminhoPDF = path.join(process.cwd(), 'boletos', `boleto-${Date.now()}.pdf`);
      
      await boletosService.gerarESalvarPDFBoleto(resposta, caminhoPDF);
      console.log(`✅ PDF gerado e salvo em: ${caminhoPDF}`);
      console.log(`   📊 Tamanho: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    }

    // Fecha recursos
    await boletosService.fecharRecursos();

    console.log('\n' + '=' .repeat(60));
    console.log('✨ Teste concluído com sucesso!');
    console.log('📄 Verifique o PDF gerado na pasta ./boletos/');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Executa o teste
if (require.main === module) {
  testeValor();
}
