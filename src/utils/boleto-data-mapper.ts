import { BoletoItauResponse, DadosIndividuaisBoletoResponse } from '../types/boleto-itau.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dados formatados para preencher o template HTML do boleto
 */
export interface DadosTemplateBoleto {
  linhaDigitavel: string;
  codigoBarras: string;
  beneficiario: {
    nome: string;
    cpfCnpj: string;
    endereco: string;
    agenciaCodigo: string;
  };
  pagador: {
    nome: string;
    cpfCnpj: string;
    endereco: string;
  };
  sacadorAvalista?: {
    nome: string;
    cpfCnpj: string;
  };
  dataVencimento: string;
  dataEmissao: string;
  dataProcessamento: string;
  valor: string;
  valorFormatado: string;
  nossoNumero: string;
  numeroDocumento: string;
  especieDoc: string;
  aceite: string;
  carteira: string;
  localPagamento: string;
  instrucoes: string;
  codigoBarrasBase64?: string;
  logoBase64?: string;
}

/**
 * Utilitário para mapear dados da resposta da API para formato do template
 */
export class BoletoDataMapper {
  /**
   * Formata data de YYYY-MM-DD para DD/MM/YYYY
   */
  static formatarData(data: string): string {
    if (!data) return '';
    const partes = data.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return data;
  }

  /**
   * Formata valor monetário
   */
  static formatarValor(valor: string | number): string {
    if (!valor) return '0,00';
    
    let valorNumerico: number;
    if (typeof valor === 'string') {
      // Se for string com formato "00000000000010001" (sem pontos decimais)
      if (valor.length > 2 && !valor.includes('.')) {
        valorNumerico = parseInt(valor) / 100;
      } else {
        valorNumerico = parseFloat(valor);
      }
    } else {
      valorNumerico = valor;
    }

    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Formata CPF ou CNPJ
   */
  static formatarCPFCNPJ(cpf?: string, cnpj?: string): string {
    if (cnpj) {
      // Formata CNPJ: XX.XXX.XXX/XXXX-XX
      const limpo = cnpj.replace(/\D/g, '');
      if (limpo.length === 14) {
        return `${limpo.substring(0, 2)}.${limpo.substring(2, 5)}.${limpo.substring(5, 8)}/${limpo.substring(8, 12)}-${limpo.substring(12)}`;
      }
      return cnpj;
    }
    if (cpf) {
      // Formata CPF: XXX.XXX.XXX-XX
      const limpo = cpf.replace(/\D/g, '');
      if (limpo.length === 11) {
        return `${limpo.substring(0, 3)}.${limpo.substring(3, 6)}.${limpo.substring(6, 9)}-${limpo.substring(9)}`;
      }
      return cpf;
    }
    return '';
  }

  /**
   * Formata linha digitável com pontos e espaços
   */
  static formatarLinhaDigitavel(linha: string): string {
    if (!linha) return '';
    // Remove espaços e pontos existentes
    const limpa = linha.replace(/\s|\./g, '');
    // Formata: XXXXX.XXXXX XXXXX.XXXXXX XXXXX.XXXXXX X XXXXXXXXXXXXXX
    if (limpa.length >= 47) {
      return `${limpa.substring(0, 5)}.${limpa.substring(5, 10)} ${limpa.substring(10, 15)}.${limpa.substring(15, 21)} ${limpa.substring(21, 26)}.${limpa.substring(26, 32)} ${limpa.substring(32, 33)} ${limpa.substring(33)}`;
    }
    return linha;
  }

  /**
   * Formata endereço completo
   */
  static formatarEndereco(endereco: {
    nome_logradouro?: string;
    nome_bairro?: string;
    nome_cidade?: string;
    sigla_UF?: string;
    numero_CEP?: string;
  }): string {
    if (!endereco) return '';
    
    const partes: string[] = [];
    if (endereco.nome_logradouro) partes.push(endereco.nome_logradouro);
    if (endereco.nome_bairro) partes.push(endereco.nome_bairro);
    if (endereco.nome_cidade) partes.push(endereco.nome_cidade);
    if (endereco.sigla_UF) partes.push(endereco.sigla_UF);
    if (endereco.numero_CEP) {
      const cep = endereco.numero_CEP.replace(/\D/g, '');
      const cepFormatado = cep.length === 8 ? `${cep.substring(0, 5)}-${cep.substring(5)}` : cep;
      partes.push(cepFormatado);
    }
    
    return partes.join(' - ');
  }

  /**
   * Extrai agência e código do beneficiário
   */
  static extrairAgenciaCodigo(idBeneficiario: string): string {
    // Formato pode variar, exemplo: "123/54321-01"
    // Por enquanto retorna o ID formatado
    if (idBeneficiario && idBeneficiario.length > 0) {
      return idBeneficiario;
    }
    return '';
  }

  /**
   * Mapeia dados da resposta da API para formato do template
   */
  static mapearDados(resposta: BoletoItauResponse): DadosTemplateBoleto {
    const boletoIndividual = resposta.dado_boleto?.dados_individuais_boleto?.[0];
    
    if (!boletoIndividual) {
      throw new Error('Dados individuais do boleto não encontrados na resposta da API');
    }

    const beneficiario = resposta.beneficiario;
    const pagador = resposta.dado_boleto?.pagador;
    const sacadorAvalista = resposta.dado_boleto?.sacador_avalista;

    // Linha digitável - pode vir em diferentes campos
    const linhaDigitavel = boletoIndividual.numero_linha_digitavel || 
                          boletoIndividual.linha_digitavel || 
                          '';

    // Código de barras
    const codigoBarras = boletoIndividual.codigo_barras || '';

    // Valor
    const valor = boletoIndividual.valor_titulo || resposta.dado_boleto?.valor_total_titulo || '0';
    const valorFormatado = this.formatarValor(valor);

    // Datas
    const dataVencimento = this.formatarData(boletoIndividual.data_vencimento || '');
    const dataEmissao = this.formatarData(resposta.dado_boleto?.data_emissao || '');
    const dataProcessamento = dataEmissao; // Usa data de emissão como processamento

    // Beneficiário
    const beneficiarioNome = beneficiario?.nome_cobranca || '';
    const beneficiarioCPFCNPJ = this.formatarCPFCNPJ(
      beneficiario?.tipo_pessoa?.numero_cadastro_pessoa_fisica,
      beneficiario?.tipo_pessoa?.numero_cadastro_nacional_pessoa_juridica
    );
    const beneficiarioEndereco = this.formatarEndereco(beneficiario?.endereco || {});
    const agenciaCodigo = this.extrairAgenciaCodigo(beneficiario?.id_beneficiario || '');

    // Pagador
    const pagadorNome = pagador?.pessoa?.nome_pessoa || '';
    const pagadorCPFCNPJ = this.formatarCPFCNPJ(
      pagador?.pessoa?.tipo_pessoa?.numero_cadastro_pessoa_fisica,
      pagador?.pessoa?.tipo_pessoa?.numero_cadastro_nacional_pessoa_juridica
    );
    const pagadorEndereco = this.formatarEndereco(pagador?.endereco || {});

    // Sacador/Avalista
    let sacadorAvalistaDados;
    if (sacadorAvalista) {
      sacadorAvalistaDados = {
        nome: sacadorAvalista.pessoa?.nome_pessoa || '',
        cpfCnpj: this.formatarCPFCNPJ(
          sacadorAvalista.pessoa?.tipo_pessoa?.numero_cadastro_pessoa_fisica,
          sacadorAvalista.pessoa?.tipo_pessoa?.numero_cadastro_nacional_pessoa_juridica
        ),
      };
    }

    // Instruções
    const instrucoes = resposta.dado_boleto?.lista_mensagem_cobranca
      ?.map(msg => msg.mensagem || '')
      .filter(msg => msg)
      .join(' ') || '';

    return {
      linhaDigitavel: this.formatarLinhaDigitavel(linhaDigitavel),
      codigoBarras,
      beneficiario: {
        nome: beneficiarioNome,
        cpfCnpj: beneficiarioCPFCNPJ,
        endereco: beneficiarioEndereco,
        agenciaCodigo,
      },
      pagador: {
        nome: pagadorNome,
        cpfCnpj: pagadorCPFCNPJ,
        endereco: pagadorEndereco,
      },
      sacadorAvalista: sacadorAvalistaDados,
      dataVencimento,
      dataEmissao,
      dataProcessamento,
      valor,
      valorFormatado,
      nossoNumero: boletoIndividual.numero_nosso_numero || '',
      numeroDocumento: boletoIndividual.texto_seu_numero || '',
      especieDoc: resposta.dado_boleto?.codigo_especie || '01',
      aceite: resposta.dado_boleto?.codigo_aceite || 'N',
      carteira: resposta.dado_boleto?.codigo_carteira || '',
      localPagamento: 'Pagável em qualquer banco até o vencimento',
      instrucoes,
    };
  }

  /**
   * Carrega logo do Itaú como base64
   */
  static carregarLogoBase64(): string {
    try {
      const logoPath = path.join(__dirname, '../client/template_html/itau-logo.svg');
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('Erro ao carregar logo:', error);
      return '';
    }
  }
}
