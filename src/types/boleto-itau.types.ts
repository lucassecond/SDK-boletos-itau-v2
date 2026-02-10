/**
 * Tipos TypeScript para criação de boletos na API do Itaú
 * Baseado na documentação oficial: https://devportal.itau.com.br/nossas-apis/itau-ep9-gtw-cash-management-ext-v2
 */

/**
 * Tipo de pessoa (Física ou Jurídica)
 */
export type TipoPessoa = 'F' | 'J';

/**
 * Tipo de pessoa com dados completos
 */
export interface TipoPessoaCompleto {
  codigo_tipo_pessoa: TipoPessoa;
  numero_cadastro_pessoa_fisica?: string; // CPF
  numero_cadastro_nacional_pessoa_juridica?: string; // CNPJ
}

/**
 * Endereço completo
 */
export interface EnderecoCompleto {
  nome_logradouro: string;
  nome_bairro: string;
  nome_cidade: string;
  sigla_UF: string;
  numero_CEP: string;
}

/**
 * Pessoa com dados completos
 */
export interface PessoaCompleta {
  nome_pessoa: string;
  nome_fantasia?: string;
  tipo_pessoa: TipoPessoaCompleto;
}

/**
 * Beneficiário do boleto
 */
export interface Beneficiario {
  id_beneficiario: string;
  nome_cobranca: string;
  tipo_pessoa: TipoPessoaCompleto;
  endereco: EnderecoCompleto;
}

/**
 * Configuração de protesto
 */
export interface Protesto {
  codigo_tipo_protesto: number;
  quantidade_dias_protesto: number;
  protesto_falimentar: boolean;
}

/**
 * Configuração de negativação
 */
export interface Negativacao {
  codigo_tipo_negativacao: number;
  quantidade_dias_negativacao: number;
}

/**
 * Instrução de cobrança
 */
export interface InstrucaoCobranca {
  codigo_instrucao_cobranca: number;
  quantidade_dias_apos_vencimento: number;
  dia_util: boolean;
}

/**
 * Pagador do boleto
 */
export interface Pagador {
  pessoa: PessoaCompleta;
  endereco: EnderecoCompleto;
  texto_endereco_email: string;
}

/**
 * Sacador avalista
 */
export interface SacadorAvalista {
  pessoa: PessoaCompleta;
  endereco: EnderecoCompleto;
  exclusao_sacador_avalista: boolean;
}

/**
 * Dados individuais do boleto
 */
export interface DadosIndividuaisBoleto {
  numero_nosso_numero: string;
  data_vencimento: string; // Formato: YYYY-MM-DD
  valor_titulo: string; // Formato: "180.00"
  texto_seu_numero: string;
  data_limite_pagamento: string; // Formato: YYYY-MM-DD
  texto_uso_beneficiario: string;
}

/**
 * Configuração de juros
 */
export interface Juros {
  codigo_tipo_juros: string;
  quantidade_dias_juros: number;
  valor_juros: string;
  percentual_juros: string;
  data_juros: string; // Formato: YYYY-MM-DD
}

/**
 * Configuração de multa
 */
export interface Multa {
  codigo_tipo_multa: string;
  quantidade_dias_multa: number;
  valor_multa: string;
  percentual_multa: string;
}

/**
 * Desconto individual
 */
export interface DescontoIndividual {
  data_desconto: string; // Formato: YYYY-MM-DD
  valor_desconto: string;
  percentual_desconto: string;
}

/**
 * Configuração de desconto
 */
export interface Desconto {
  codigo_tipo_desconto: string;
  descontos: DescontoIndividual[];
}

/**
 * Mensagem de cobrança
 */
export interface MensagemCobranca {
  [key: string]: any; // Estrutura pode variar
}

/**
 * Recebimento divergente
 */
export interface RecebimentoDivergente {
  codigo_tipo_autorizacao: number;
  valor_minimo: string;
  percentual_minimo: string;
  valor_maximo: string;
  percentual_maximo: string;
}

/**
 * Dados completos do boleto para criação
 */
export interface DadosBoletoItau {
  etapa_processo_boleto: 'validacao' | 'emissao';
  codigo_canal_operacao: string;
  beneficiario: Beneficiario;
  dado_boleto: {
    descricao_instrumento_cobranca: string;
    tipo_boleto: string;
    forma_envio: string;
    protesto?: Protesto;
    negativacao?: Negativacao;
    instrucao_cobranca?: InstrucaoCobranca[];
    pagador: Pagador;
    sacador_avalista?: SacadorAvalista;
    codigo_carteira: string;
    codigo_tipo_vencimento: number;
    dados_individuais_boleto: DadosIndividuaisBoleto[];
    codigo_especie: string;
    descricao_especie: string;
    codigo_aceite: string;
    data_emissao: string; // Formato: YYYY-MM-DD
    pagamento_parcial?: boolean;
    quantidade_maximo_parcial?: number;
    valor_abatimento?: string;
    juros?: Juros;
    multa?: Multa;
    desconto?: Desconto;
    mensagens_cobranca?: MensagemCobranca[];
    recebimento_divergente?: RecebimentoDivergente;
    desconto_expresso?: boolean;
    texto_uso_beneficiario?: string;
  };
}

/**
 * Dados individuais do boleto na resposta da API
 */
export interface DadosIndividuaisBoletoResponse {
  id_boleto_individual?: string;
  numero_nosso_numero?: string;
  dac_titulo?: string;
  linha_digitavel?: string;
  numero_linha_digitavel?: string; // Campo alternativo usado pela API
  codigo_barras?: string;
  data_vencimento?: string;
  valor_titulo?: string;
  texto_seu_numero?: string;
  data_limite_pagamento?: string;
  status?: string;
  lista_mensagens_cobranca?: any[];
  [key: string]: any;
}

/**
 * Resposta da API ao criar boleto
 */
export interface BoletoItauResponse {
  etapa_processo_boleto?: string;
  codigo_canal_operacao?: string;
  codigo_operador?: string;
  beneficiario?: {
    id_beneficiario?: string;
    nome_cobranca?: string;
    tipo_pessoa?: TipoPessoaCompleto;
    endereco?: EnderecoCompleto;
  };
  dado_boleto?: {
    descricao_instrumento_cobranca?: string;
    forma_envio?: string;
    tipo_boleto?: string;
    pagador?: Pagador & {
      pagador_eletronico_DDA?: boolean;
      praca_protesto?: boolean;
    };
    sacador_avalista?: SacadorAvalista;
    codigo_carteira?: string;
    codigo_tipo_vencimento?: number;
    valor_total_titulo?: string;
    dados_individuais_boleto?: DadosIndividuaisBoletoResponse[];
    codigo_especie?: string;
    data_emissao?: string;
    pagamento_parcial?: boolean;
    quantidade_maximo_parcial?: string;
    juros?: Juros;
    lista_mensagem_cobranca?: Array<{ mensagem: string }>;
    recebimento_divergente?: RecebimentoDivergente & {
      codigo_tipo_recebimento?: string;
    };
    desconto_expresso?: boolean;
    [key: string]: any;
  };
  [key: string]: any; // Permite campos adicionais da resposta
}
