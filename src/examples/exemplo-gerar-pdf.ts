import { BoletosService } from '../services/boletos.service';
import { BoletoBuilder } from '../utils/boleto-builder';
import { DadosBoletoItau } from '../types/boleto-itau.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Exemplo de criação de boleto e geração de PDF
 */
async function exemploGerarPDF() {
  console.log('📄 Exemplo: Criar Boleto e Gerar PDF\n');

  try {
    // Inicializa o serviço
    const boletosService = new BoletosService();

    // Valida credenciais
    console.log('1️⃣  Validando credenciais...');
    const credenciais = await boletosService.validarCredenciais();
    
    if (!credenciais.todasValidadas) {
      console.log('❌ Credenciais não configuradas');
      return;
    }
    console.log('✅ Credenciais validadas\n');

    // Gera tokens
    console.log('2️⃣  Gerando tokens...');
    const tokens = await boletosService.gerarTokens();
    console.log('✅ Tokens gerados\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Criar boleto usando Builder
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('3️⃣  Criando boleto...\n');

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

    const boleto: DadosBoletoItau = BoletoBuilder.criarBoletoCompleto({
      etapaProcesso: 'validacao',
      codigoCanalOperacao: 'API',
      beneficiario,
      pagador,
      nossoNumero: '12345678',
      dataVencimento: '2026-02-20',
      valor: 180.00,
      seuNumero: '123',
      codigoCarteira: '109',
      codigoTipoVencimento: 1,
      codigoEspecie: '01',
      descricaoEspecie: 'Duplicata de Venda Mercantil',
      codigoAceite: 'S',
      dataEmissao: '2026-02-09',
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Criar boleto na API e gerar PDF automaticamente
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('4️⃣  Enviando boleto para API e gerando PDF...\n');

    try {
      // Criar boleto com geração automática de PDF
      const resposta = await boletosService.criarBoletoItau(boleto, undefined, true);
      
      console.log('✅ Boleto criado com sucesso!');
      
      if (resposta.dado_boleto?.dados_individuais_boleto?.[0]) {
        const boletoIndividual = resposta.dado_boleto.dados_individuais_boleto[0];
        console.log(`   Nosso Número: ${boletoIndividual.numero_nosso_numero}`);
        console.log(`   Linha Digitável: ${boletoIndividual.numero_linha_digitavel || boletoIndividual.linha_digitavel}`);
        console.log(`   Valor: R$ ${boletoIndividual.valor_titulo ? (parseInt(boletoIndividual.valor_titulo) / 100).toFixed(2) : '0,00'}`);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Salvar PDF em arquivo
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (resposta.pdf) {
        console.log('\n5️⃣  Salvando PDF...\n');
        
        const caminhoPDF = path.join(process.cwd(), 'boletos', `boleto-${Date.now()}.pdf`);
        
        // Cria diretório se não existir
        const diretorioPDF = path.dirname(caminhoPDF);
        if (!fs.existsSync(diretorioPDF)) {
          fs.mkdirSync(diretorioPDF, { recursive: true });
        }

        fs.writeFileSync(caminhoPDF, resposta.pdf);
        console.log(`✅ PDF salvo em: ${caminhoPDF}`);
        console.log(`   Tamanho: ${(resposta.pdf.length / 1024).toFixed(2)} KB\n`);
      } else {
        console.log('\n⚠️  PDF não foi gerado automaticamente\n');
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Gerar PDF manualmente
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('6️⃣  Gerando PDF manualmente...\n');
        
        const pdfBuffer = await boletosService.gerarPDFBoleto(resposta);
        const caminhoPDF = path.join(process.cwd(), 'boletos', `boleto-${Date.now()}.pdf`);
        
        await boletosService.gerarESalvarPDFBoleto(resposta, caminhoPDF);
        console.log(`✅ PDF gerado e salvo em: ${caminhoPDF}`);
        console.log(`   Tamanho: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
      }

    } catch (error) {
      console.error('❌ Erro ao criar boleto ou gerar PDF:', error instanceof Error ? error.message : error);
    }

    // Fecha recursos
    await boletosService.fecharRecursos();

    console.log('✨ Exemplo concluído!');
    console.log('\n💡 Dicas:');
    console.log('   - O PDF é gerado automaticamente ao criar o boleto');
    console.log('   - Use gerarPDFBoleto() para gerar PDF de um boleto existente');
    console.log('   - Use gerarESalvarPDFBoleto() para gerar e salvar diretamente');

  } catch (error) {
    console.error('\n❌ Erro no exemplo:', error instanceof Error ? error.message : error);
  }
}

// Executa o exemplo se chamado diretamente
if (require.main === module) {
  exemploGerarPDF();
}
