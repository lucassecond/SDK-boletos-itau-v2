/**
 * Tipos TypeScript para integração com API de Boletos Itaú
 */

/**
 * Resposta da autenticação OAuth
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  active: boolean;
  scope: string;
}

/**
 * Token armazenado em cache com informações de expiração
 */
export interface CachedToken {
  token: string;
  expiresAt: number;
}

/**
 * Dados básicos de um cliente
 */
export interface Cliente {
  id: string;
  nome: string;
  tipo: 'PF' | 'PJ';
  documento: string; // CPF ou CNPJ
  email: string;
  telefone?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

/**
 * Dados simplificados para geração de boleto (interface legada - use DadosBoletoItau)
 * @deprecated Use DadosBoletoItau da documentação oficial
 */
export interface DadosBoleto {
  clienteId: string;
  valor: number;
  dataVencimento: string; // ISO 8601 format
  descricao: string;
  numeroDocumento?: string;
  instrucoes?: string[];
}

/**
 * Resposta da API ao criar boleto (interface legada)
 * @deprecated Use BoletoItauResponse da documentação oficial
 */
export interface BoletoResponse {
  codigoBarras?: string;
  linhaDigitavel?: string;
  nossoNumero?: string;
  numeroDocumento?: string;
  valor?: number;
  dataVencimento?: string;
  status?: string;
}

// Exporta os novos tipos da API oficial
export * from './boleto-itau.types';

/**
 * Resultado da validação de credenciais
 */
export interface CredenciaisValidadas {
  clientId: boolean;
  clientSecret: boolean;
  apiKey: boolean;
  todasValidadas: boolean;
}

/**
 * Tokens gerados e prontos para uso
 */
export interface TokensGerados {
  oauthToken: string;
  apiKey: string;
  correlationId: string;
  headers: {
    Authorization: string;
    'x-itau-apikey': string;
    'x-itau-correlationID': string;
    'Content-Type': string;
  };
}
