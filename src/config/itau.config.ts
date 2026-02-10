import * as dotenv from 'dotenv';
import { ConfigLoader } from '../utils/config-loader';

// Carrega variáveis de ambiente
dotenv.config();

// Instância do loader para busca automática
const configLoader = new ConfigLoader();

/**
 * Busca API Key automaticamente de múltiplas fontes
 */
function buscarApiKeyAutomaticamente(): string {
  const apiKeySource = configLoader.buscarApiKey();
  
  if (apiKeySource.value && !configLoader.isPlaceholder(apiKeySource.value)) {
    return apiKeySource.value;
  }

  // Tenta buscar da variável de ambiente do sistema também
  const systemApiKey = process.env.ITAU_API_KEY;
  if (systemApiKey && !configLoader.isPlaceholder(systemApiKey)) {
    return systemApiKey;
  }

  return '';
}

/**
 * Configurações da API Itaú
 * Busca automaticamente de múltiplas fontes (variáveis de ambiente do sistema, .env, etc)
 */
export const ItauConfig = {
  clientId: process.env.ITAU_CLIENT_ID || '',
  clientSecret: process.env.ITAU_CLIENT_SECRET || '',
  apiKey: buscarApiKeyAutomaticamente(),
  sandboxUrl: process.env.ITAU_SANDBOX_URL || 'https://sandbox.devportal.itau.com.br/itau-ep9-gtw-cash-management-ext-v2/v2',
  oauthUrl: process.env.ITAU_OAUTH_URL || 'https://sandbox.devportal.itau.com.br/api/oauth/jwt',
};

/**
 * Exporta o config loader para uso externo
 */
export { configLoader };

/**
 * Valida se as configurações necessárias estão presentes
 */
export function validateConfig(): void {
  if (!ItauConfig.clientId) {
    throw new Error('ITAU_CLIENT_ID não configurado no .env');
  }
  if (!ItauConfig.clientSecret) {
    throw new Error('ITAU_CLIENT_SECRET não configurado no .env');
  }
}

/**
 * Valida se a API Key está configurada (necessária para requisições à API de boletos)
 */
export function validateApiKey(): void {
  if (!ItauConfig.apiKey) {
    throw new Error('ITAU_API_KEY não configurado no .env. Obtenha sua API Key em https://devportal.itau.com.br');
  }
}

/**
 * Valida todas as credenciais necessárias para o fluxo completo
 */
export function validateAllCredentials(): void {
  validateConfig();
  validateApiKey();
}
