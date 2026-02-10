import { DadosBoletoItau, Beneficiario, Pagador, DadosIndividuaisBoleto, TipoPessoaCompleto, EnderecoCompleto } from '../types/boleto-itau.types';

/**
 * Builder para facilitar a criação de boletos com dados simplificados
 */
export class BoletoBuilder {
  /**
   * Cria um objeto TipoPessoaCompleto a partir de dados simplificados
   */
  static criarTipoPessoa(
    tipo: 'F' | 'J',
    cpf?: string,
    cnpj?: string
  ): TipoPessoaCompleto {
    if (tipo === 'F') {
      return {
        codigo_tipo_pessoa: 'F',
        numero_cadastro_pessoa_fisica: cpf,
      };
    } else {
      return {
        codigo_tipo_pessoa: 'J',
        numero_cadastro_nacional_pessoa_juridica: cnpj,
      };
    }
  }

  /**
   * Cria um EnderecoCompleto a partir de dados simplificados
   */
  static criarEndereco(
    logradouro: string,
    bairro: string,
    cidade: string,
    uf: string,
    cep: string
  ): EnderecoCompleto {
    return {
      nome_logradouro: logradouro,
      nome_bairro: bairro,
      nome_cidade: cidade,
      sigla_UF: uf,
      numero_CEP: cep,
    };
  }

  /**
   * Cria um Beneficiario a partir de dados simplificados
   */
  static criarBeneficiario(
    idBeneficiario: string,
    nomeCobranca: string,
    tipo: 'F' | 'J',
    cpf?: string,
    cnpj?: string,
    endereco?: EnderecoCompleto
  ): Beneficiario {
    return {
      id_beneficiario: idBeneficiario,
      nome_cobranca: nomeCobranca,
      tipo_pessoa: this.criarTipoPessoa(tipo, cpf, cnpj),
      endereco: endereco || this.criarEndereco('', '', '', '', ''),
    };
  }

  /**
   * Cria um Pagador a partir de dados simplificados
   */
  static criarPagador(
    nome: string,
    tipo: 'F' | 'J',
    cpf?: string,
    cnpj?: string,
    email: string = '',
    endereco?: EnderecoCompleto,
    nomeFantasia?: string
  ): Pagador {
    return {
      pessoa: {
        nome_pessoa: nome,
        nome_fantasia: nomeFantasia,
        tipo_pessoa: this.criarTipoPessoa(tipo, cpf, cnpj),
      },
      endereco: endereco || this.criarEndereco('', '', '', '', ''),
      texto_endereco_email: email,
    };
  }

  /**
   * Cria DadosIndividuaisBoleto a partir de dados simplificados
   * 
   * IMPORTANTE: A API do Itaú espera o valor em formato de string
   * Baseado na documentação: formato pode ser "180.00" (com ponto) ou apenas números
   * Vamos usar o formato com ponto decimal conforme exemplo da documentação
   */
  static criarDadosIndividuais(
    nossoNumero: string,
    dataVencimento: string,
    valor: number,
    seuNumero: string,
    dataLimitePagamento?: string,
    textoUsoBeneficiario?: string
  ): DadosIndividuaisBoleto {
    // Formata valor com 2 casas decimais e ponto como separador
    // Exemplo: 15162.12 -> "15162.12"
    // Isso mantém compatibilidade com o formato da documentação oficial
    const valorFormatado = valor.toFixed(2);
    
    return {
      numero_nosso_numero: nossoNumero,
      data_vencimento: dataVencimento,
      valor_titulo: valorFormatado,
      texto_seu_numero: seuNumero,
      data_limite_pagamento: dataLimitePagamento || dataVencimento,
      texto_uso_beneficiario: textoUsoBeneficiario || '',
    };
  }

  /**
   * Cria um boleto completo usando a estrutura oficial da API
   * 
   * @param opcoes Opções para criação do boleto
   */
  static criarBoletoCompleto(opcoes: {
    etapaProcesso: 'validacao' | 'emissao';
    codigoCanalOperacao?: string;
    beneficiario: Beneficiario;
    pagador: Pagador;
    nossoNumero: string;
    dataVencimento: string;
    valor: number;
    seuNumero: string;
    codigoCarteira?: string;
    codigoTipoVencimento?: number;
    codigoEspecie?: string;
    descricaoEspecie?: string;
    codigoAceite?: string;
    dataEmissao?: string;
    sacadorAvalista?: any;
    [key: string]: any;
  }): DadosBoletoItau {
    const dataEmissao = opcoes.dataEmissao || new Date().toISOString().split('T')[0];
    
    return {
      etapa_processo_boleto: opcoes.etapaProcesso,
      codigo_canal_operacao: opcoes.codigoCanalOperacao || 'API',
      beneficiario: opcoes.beneficiario,
      dado_boleto: {
        descricao_instrumento_cobranca: 'boleto',
        tipo_boleto: 'a vista',
        forma_envio: 'impressão',
        pagador: opcoes.pagador,
        codigo_carteira: opcoes.codigoCarteira || '109',
        codigo_tipo_vencimento: opcoes.codigoTipoVencimento || 1,
        dados_individuais_boleto: [
          this.criarDadosIndividuais(
            opcoes.nossoNumero,
            opcoes.dataVencimento,
            opcoes.valor,
            opcoes.seuNumero
          ),
        ],
        codigo_especie: opcoes.codigoEspecie || '01',
        descricao_especie: opcoes.descricaoEspecie || 'Duplicata de Venda Mercantil',
        codigo_aceite: opcoes.codigoAceite || 'S',
        data_emissao: dataEmissao,
        ...(opcoes.sacadorAvalista && { sacador_avalista: opcoes.sacadorAvalista }),
        // Permite passar campos adicionais
        ...Object.fromEntries(
          Object.entries(opcoes).filter(([key]) => 
            !['etapaProcesso', 'codigoCanalOperacao', 'beneficiario', 'pagador', 
              'nossoNumero', 'dataVencimento', 'valor', 'seuNumero', 
              'codigoCarteira', 'codigoTipoVencimento', 'codigoEspecie', 
              'descricaoEspecie', 'codigoAceite', 'dataEmissao', 'sacadorAvalista'].includes(key)
          )
        ),
      },
    };
  }
}
