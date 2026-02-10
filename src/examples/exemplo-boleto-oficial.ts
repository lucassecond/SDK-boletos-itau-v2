import { BoletosService } from '../services/boletos.service';
import { BoletoBuilder } from '../utils/boleto-builder';
import { DadosBoletoItau } from '../types/boleto-itau.types';

/**
 * Exemplo de criação de boleto usando a estrutura oficial da API Itaú
 * Baseado na documentação: https://devportal.itau.com.br/nossas-apis/itau-ep9-gtw-cash-management-ext-v2
 */
async function exemploBoletoOficial() {
  console.log('📄 Exemplo: Criar Boleto usando Estrutura Oficial da API Itaú\n');

  try {
    // Inicializa o serviço
    const boletosService = new BoletosService();

    // Valida credenciais e resolve API Key automaticamente
    console.log('1️⃣  Validando credenciais...');
    const credenciais = await boletosService.validarCredenciais();
    
    if (!credenciais.todasValidadas) {
      console.log('❌ Credenciais não configuradas');
      return;
    }
    console.log('✅ Credenciais validadas\n');

    // Gera tokens necessários
    console.log('2️⃣  Gerando tokens...');
    const tokens = await boletosService.gerarTokens();
    console.log('✅ Tokens gerados\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPÇÃO 1: Usar o Builder para facilitar a criação
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('3️⃣  Criando boleto usando Builder (método simplificado)...\n');

    const beneficiario = BoletoBuilder.criarBeneficiario(
      '150000052061', // ID do beneficiário
      'Antonio Coutinho SA', // Nome
      'J', // Tipo: Jurídica
      undefined, // CPF (não necessário para PJ)
      '12345678901234', // CNPJ
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
      'J', // Tipo: Jurídica
      undefined, // CPF
      '12345678901234', // CNPJ
      'itau@itau-unibanco.com.br',
      BoletoBuilder.criarEndereco(
        'rua dona ana neri, 368',
        'Mooca',
        'Sao Paulo',
        'SP',
        '12345678'
      ),
      'Empresa A' // Nome fantasia
    );

    const boletoComBuilder = BoletoBuilder.criarBoletoCompleto({
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

    console.log('📋 Boleto criado com Builder:');
    console.log(JSON.stringify(boletoComBuilder, null, 2).substring(0, 500) + '...\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPÇÃO 2: Usar a estrutura completa diretamente (como na documentação)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('4️⃣  Criando boleto usando estrutura completa (como na documentação)...\n');

    const boletoCompleto: DadosBoletoItau = {
      etapa_processo_boleto: 'validacao',
      codigo_canal_operacao: 'API',
      beneficiario: {
        id_beneficiario: '150000052061',
        nome_cobranca: 'Antonio Coutinho SA',
        tipo_pessoa: {
          codigo_tipo_pessoa: 'J',
          numero_cadastro_nacional_pessoa_juridica: '12345678901234',
        },
        endereco: {
          nome_logradouro: 'rua dona ana neri, 368',
          nome_bairro: 'Mooca',
          nome_cidade: 'Sao Paulo',
          sigla_UF: 'SP',
          numero_CEP: '12345678',
        },
      },
      dado_boleto: {
        descricao_instrumento_cobranca: 'boleto',
        tipo_boleto: 'a vista',
        forma_envio: 'impressão',
        pagador: {
          pessoa: {
            nome_pessoa: 'Antônio Coutinho',
            nome_fantasia: 'Empresa A',
            tipo_pessoa: {
              codigo_tipo_pessoa: 'J',
              numero_cadastro_nacional_pessoa_juridica: '12345678901234',
            },
          },
          endereco: {
            nome_logradouro: 'rua dona ana neri, 368',
            nome_bairro: 'Mooca',
            nome_cidade: 'Sao Paulo',
            sigla_UF: 'SP',
            numero_CEP: '12345678',
          },
          texto_endereco_email: 'itau@itau-unibanco.com.br',
        },
        codigo_carteira: '109',
        codigo_tipo_vencimento: 1,
        dados_individuais_boleto: [
          {
            numero_nosso_numero: '12345678',
            data_vencimento: '2026-02-20',
            valor_titulo: '180.00',
            texto_seu_numero: '123',
            data_limite_pagamento: '2026-02-20',
            texto_uso_beneficiario: 'abc123abc123abc123',
          },
        ],
        codigo_especie: '01',
        descricao_especie: 'Duplicata de Venda Mercantil',
        codigo_aceite: 'S',
        data_emissao: '2026-02-09',
      },
    };

    console.log('📋 Boleto criado com estrutura completa:');
    console.log(JSON.stringify(boletoCompleto, null, 2).substring(0, 500) + '...\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Enviar para a API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('5️⃣  Enviando boleto para API...\n');
    
    try {
      // Criar boleto com geração automática de PDF (terceiro parâmetro = true)
      const resposta = await boletosService.criarBoletoItau(boletoCompleto, undefined, true);
      console.log('✅ Boleto criado com sucesso!');
      console.log('📄 Resposta da API:');
      console.log(JSON.stringify(resposta, null, 2));
      
      // PDF está disponível em resposta.pdf (se gerado)
      if (resposta.pdf) {
        console.log(`\n📄 PDF gerado: ${(resposta.pdf.length / 1024).toFixed(2)} KB`);
      }
      
      // Exibe informações importantes do boleto criado
      if (resposta.dado_boleto?.dados_individuais_boleto?.[0]) {
        const boletoIndividual = resposta.dado_boleto.dados_individuais_boleto[0];
        console.log('\n📋 Informações do Boleto Criado:');
        console.log(`   Nosso Número: ${boletoIndividual.numero_nosso_numero || 'N/A'}`);
        console.log(`   Código de Barras: ${boletoIndividual.codigo_barras || 'N/A'}`);
        console.log(`   Linha Digitável: ${boletoIndividual.linha_digitavel || (boletoIndividual as any).numero_linha_digitavel || 'N/A'}`);
        console.log(`   Data Vencimento: ${boletoIndividual.data_vencimento || 'N/A'}`);
        if (boletoIndividual.valor_titulo) {
          const valor = parseInt(boletoIndividual.valor_titulo) / 100;
          console.log(`   Valor: R$ ${valor.toFixed(2)}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar boleto:', error instanceof Error ? error.message : error);
    }

    console.log('✨ Exemplo concluído!');
    console.log('\n💡 Dicas:');
    console.log('   - Use BoletoBuilder para criar boletos de forma simplificada');
    console.log('   - Use DadosBoletoItau diretamente para controle total');
    console.log('   - Consulte a documentação: https://devportal.itau.com.br/nossas-apis/itau-ep9-gtw-cash-management-ext-v2');

  } catch (error) {
    console.error('\n❌ Erro no exemplo:', error instanceof Error ? error.message : error);
  }
}

// Executa o exemplo se chamado diretamente
if (require.main === module) {
  exemploBoletoOficial();
}
