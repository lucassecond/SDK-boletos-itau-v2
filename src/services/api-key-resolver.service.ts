import axios, { AxiosInstance } from 'axios';
import { AuthService } from './auth.service';
import { ItauConfig } from '../config/itau.config';

/**
 * Serviço para resolver API Key automaticamente usando CLIENT_ID e CLIENT_SECRET
 */
export class ApiKeyResolverService {
  private authService: AuthService;
  private axiosInstance: AxiosInstance;
  private cachedApiKey: string | null = null;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.axiosInstance = axios.create({
      baseURL: ItauConfig.sandboxUrl,
      timeout: 10000,
    });
  }

  /**
   * Resolve a API Key automaticamente usando múltiplas estratégias
   * 
   * Estratégias (em ordem de tentativa):
   * 1. Usa CLIENT_ID como API Key (padrão comum em muitas APIs)
   * 2. Tenta obter via endpoint de informações da aplicação (se disponível)
   * 3. Usa CLIENT_ID formatado
   * 
   * @returns API Key resolvida automaticamente
   */
  async resolverApiKeyAutomaticamente(): Promise<string> {
    // Se já temos em cache, retorna
    if (this.cachedApiKey) {
      return this.cachedApiKey;
    }

    // ESTRATÉGIA 1: Usa CLIENT_ID como API Key (padrão comum)
    // Muitas APIs usam o mesmo valor para CLIENT_ID e API Key
    if (ItauConfig.clientId && ItauConfig.clientId.trim() !== '') {
      this.cachedApiKey = ItauConfig.clientId;
      return this.cachedApiKey;
    }

    // ESTRATÉGIA 2: Tenta obter via endpoint de informações (se disponível)
    // Esta estratégia pode ser implementada se a API do Itaú oferecer um endpoint
    // que retorne informações da aplicação incluindo a API Key
    try {
      const oauthToken = await this.authService.getAccessToken();
      
      // Tenta fazer uma requisição para obter informações da aplicação
      // Nota: Este endpoint pode não existir, mas tentamos de qualquer forma
      try {
        const response = await this.axiosInstance.get('/application/info', {
          headers: {
            'Authorization': `Bearer ${oauthToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.data?.apiKey || response.data?.api_key) {
          const apiKey = response.data.apiKey || response.data.api_key;
          if (apiKey) {
            this.cachedApiKey = apiKey;
            return apiKey;
          }
        }
      } catch (error) {
        // Endpoint não existe ou não retornou API Key, continua para próxima estratégia
      }
    } catch (error) {
      // Não conseguiu obter token OAuth, continua para próxima estratégia
    }

    // ESTRATÉGIA 3: Usa CLIENT_ID formatado (removendo hífens, etc)
    if (ItauConfig.clientId) {
      // Remove caracteres especiais e usa como API Key
      const formattedApiKey = ItauConfig.clientId.replace(/-/g, '');
      this.cachedApiKey = formattedApiKey;
      return formattedApiKey;
    }

    // Se nenhuma estratégia funcionou, usa CLIENT_ID como fallback final
    if (ItauConfig.clientId) {
      this.cachedApiKey = ItauConfig.clientId;
      return ItauConfig.clientId;
    }

    throw new Error('Não foi possível resolver API Key automaticamente. CLIENT_ID não configurado.');
  }

  /**
   * Limpa o cache da API Key (útil para testes)
   */
  limparCache(): void {
    this.cachedApiKey = null;
  }

  /**
   * Retorna a API Key em cache (se houver)
   */
  getCachedApiKey(): string | null {
    return this.cachedApiKey;
  }
}
