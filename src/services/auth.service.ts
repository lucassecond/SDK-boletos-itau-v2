import axios, { AxiosInstance } from 'axios';
import { ItauConfig, validateConfig } from '../config/itau.config';
import { OAuthTokenResponse, CachedToken } from '../types';

/**
 * Serviço de autenticação OAuth para API Itaú
 */
export class AuthService {
  private cachedToken: CachedToken | null = null;
  private axiosInstance: AxiosInstance;

  constructor() {
    validateConfig();
    this.axiosInstance = axios.create({
      baseURL: ItauConfig.oauthUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Obtém um token de acesso válido
   * Se houver um token em cache válido, retorna ele
   * Caso contrário, faz uma nova requisição para obter o token
   */
  async getAccessToken(): Promise<string> {
    // Verifica se há um token em cache válido
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.token;
    }

    // Obtém um novo token
    const tokenResponse = await this.requestNewToken();
    
    // Calcula o timestamp de expiração (expires_in está em segundos)
    const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
    
    // Armazena o token em cache
    this.cachedToken = {
      token: tokenResponse.access_token,
      expiresAt: expiresAt,
    };

    return tokenResponse.access_token;
  }

  /**
   * Faz requisição para obter um novo token OAuth
   */
  private async requestNewToken(): Promise<OAuthTokenResponse> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', ItauConfig.clientId);
      params.append('client_secret', ItauConfig.clientSecret);

      const response = await this.axiosInstance.post<OAuthTokenResponse>('', params.toString());
      
      if (!response.data.access_token) {
        throw new Error('Token não retornado na resposta da API');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erro ao obter token OAuth: ${error.response?.status} - ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Verifica se o token em cache ainda é válido
   * Considera válido se ainda não expirou (com margem de 10 segundos)
   */
  private isTokenValid(cachedToken: CachedToken): boolean {
    const now = Date.now();
    const margin = 10000; // 10 segundos de margem
    return cachedToken.expiresAt > (now + margin);
  }

  /**
   * Limpa o token em cache (útil para testes ou logout)
   */
  clearCache(): void {
    this.cachedToken = null;
  }

  /**
   * Retorna informações sobre o token em cache (sem expor o token)
   */
  getCacheInfo(): { hasToken: boolean; expiresAt: number | null } {
    return {
      hasToken: this.cachedToken !== null,
      expiresAt: this.cachedToken?.expiresAt || null,
    };
  }
}
