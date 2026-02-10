import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthService } from './auth.service';
import { ItauConfig, validateConfig, validateApiKey, configLoader } from '../config/itau.config';
import { ApiKeyManager } from '../utils/api-key-manager';
import { ApiKeyResolverService } from './api-key-resolver.service';
import { PDFGeneratorService } from './pdf-generator.service';
import { v4 as uuidv4 } from 'uuid';
import { DadosBoleto, BoletoResponse, CredenciaisValidadas, TokensGerados, DadosBoletoItau, BoletoItauResponse } from '../types';

/**
 * Serviço completo para integração com API de Boletos Itaú
 * 
 * Fluxo:
 * 1. Valida credenciais (CLIENT_ID e CLIENT_SECRET)
 * 2. Resolve API Key automaticamente usando CLIENT_ID
 * 3. Gera tokens necessários (OAuth, API Key, Correlation ID)
 * 4. Prepara requisições autenticadas
 */
export class BoletosService {
  private authService: AuthService;
  private axiosInstance: AxiosInstance;
  private initialized: boolean = false;
  private apiKeyManager: ApiKeyManager;
  private apiKeyResolver: ApiKeyResolverService;
  private pdfGenerator: PDFGeneratorService;

  constructor() {
    // Cria instância do axios para requisições à API de boletos
    this.axiosInstance = axios.create({
      baseURL: ItauConfig.sandboxUrl,
      timeout: 30000, // 30 segundos
    });

    // Inicializa o serviço de autenticação
    this.authService = new AuthService();
    
    // Inicializa o gerenciador de API Key
    this.apiKeyManager = new ApiKeyManager();
    
    // Inicializa o resolvedor automático de API Key
    this.apiKeyResolver = new ApiKeyResolverService(this.authService);
    
    // Inicializa o gerador de PDF
    this.pdfGenerator = new PDFGeneratorService();
  }

  /**
   * AÇÃO 1: Valida todas as credenciais necessárias
   * Resolve automaticamente a API Key usando CLIENT_ID e CLIENT_SECRET
   * 
   * @param resolverApiKeyAutomaticamente Se true, resolve API Key automaticamente usando CLIENT_ID
   * @returns Objeto com status de validação de cada credencial
   * @throws Error se CLIENT_ID ou CLIENT_SECRET estiverem faltando
   */
  async validarCredenciais(resolverApiKeyAutomaticamente: boolean = true): Promise<CredenciaisValidadas> {
    // Verifica se as credenciais são válidas (não são placeholders)
    const clientIdValido = !!ItauConfig.clientId && ItauConfig.clientId.trim() !== '' && !configLoader.isPlaceholder(ItauConfig.clientId);
    const clientSecretValido = !!ItauConfig.clientSecret && ItauConfig.clientSecret.trim() !== '' && !configLoader.isPlaceholder(ItauConfig.clientSecret);
    
    const resultado: CredenciaisValidadas = {
      clientId: clientIdValido,
      clientSecret: clientSecretValido,
      apiKey: false,
      todasValidadas: false,
    };

    try {
      // Valida CLIENT_ID e CLIENT_SECRET (obrigatórios)
      if (!clientIdValido || !clientSecretValido) {
        const faltando: string[] = [];
        if (!clientIdValido) faltando.push('ITAU_CLIENT_ID');
        if (!clientSecretValido) faltando.push('ITAU_CLIENT_SECRET');
        
        throw new Error(
          `Credenciais obrigatórias faltando: ${faltando.join(', ')}. ` +
          `Configure CLIENT_ID e CLIENT_SECRET no arquivo .env.`
        );
      }

      // Resolve API Key automaticamente usando CLIENT_ID
      if (resolverApiKeyAutomaticamente) {
        try {
          const apiKeyResolvida = await this.apiKeyResolver.resolverApiKeyAutomaticamente();
          // Atualiza a configuração com a API Key resolvida
          (ItauConfig as any).apiKey = apiKeyResolvida;
          resultado.apiKey = true;
        } catch (error) {
          // Se não conseguir resolver, tenta buscar de outras fontes
          const buscaApiKey = this.apiKeyManager.buscarApiKeyAutomaticamente();
          if (buscaApiKey.encontrada && buscaApiKey.valor) {
            (ItauConfig as any).apiKey = buscaApiKey.valor;
            resultado.apiKey = true;
          } else {
            // Usa CLIENT_ID como API Key (fallback)
            (ItauConfig as any).apiKey = ItauConfig.clientId;
            resultado.apiKey = true;
          }
        }
      } else {
        // Busca API Key de outras fontes (variáveis de ambiente, .env)
        const buscaApiKey = this.apiKeyManager.buscarApiKeyAutomaticamente();
        resultado.apiKey = buscaApiKey.encontrada;
        if (buscaApiKey.encontrada && buscaApiKey.valor) {
          (ItauConfig as any).apiKey = buscaApiKey.valor;
        }
      }

      resultado.todasValidadas = resultado.clientId && resultado.clientSecret && resultado.apiKey;

      return resultado;
    } catch (error) {
      throw error;
    }
  }

  /**
   * AÇÃO 2: Gera todos os tokens necessários para requisições à API
   * Resolve automaticamente a API Key usando CLIENT_ID antes de gerar os tokens
   * 
   * @param resolverApiKeyAutomaticamente Se true, resolve API Key automaticamente usando CLIENT_ID
   * @returns Objeto com todos os tokens e headers prontos para uso
   * @throws Error se não conseguir gerar os tokens
   */
  async gerarTokens(resolverApiKeyAutomaticamente: boolean = true): Promise<TokensGerados> {
    // Primeiro valida as credenciais (resolve API Key automaticamente)
    await this.validarCredenciais(resolverApiKeyAutomaticamente);

    // Garante que temos uma API Key (resolve se ainda não tiver)
    if (!ItauConfig.apiKey || ItauConfig.apiKey.trim() === '') {
      try {
        const apiKeyResolvida = await this.apiKeyResolver.resolverApiKeyAutomaticamente();
        (ItauConfig as any).apiKey = apiKeyResolvida;
      } catch (error) {
        // Fallback: usa CLIENT_ID como API Key
        (ItauConfig as any).apiKey = ItauConfig.clientId;
      }
    }

    try {
      // 1. Gera Token OAuth
      const oauthToken = await this.authService.getAccessToken();

      // 2. Obtém API Key (já validada acima)
      const apiKey = ItauConfig.apiKey;

      // 3. Gera Correlation ID único
      const correlationId = uuidv4();

      // 4. Prepara headers completos
      const headers = {
        Authorization: `Bearer ${oauthToken}`,
        'x-itau-apikey': apiKey,
        'x-itau-correlationID': correlationId,
        'Content-Type': 'application/json',
      };

      this.initialized = true;

      return {
        oauthToken,
        apiKey,
        correlationId,
        headers,
      };
    } catch (error) {
      throw new Error(
        `Erro ao gerar tokens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  /**
   * AÇÃO 3: Prepara uma requisição autenticada com todos os headers necessários
   * 
   * @param correlationId Opcional - se não fornecido, gera um novo
   * @returns Configuração do Axios com headers prontos
   */
  private async prepararRequisicaoAutenticada(correlationId?: string): Promise<AxiosRequestConfig> {
    // Gera tokens se ainda não inicializado
    if (!this.initialized) {
      await this.gerarTokens();
    }

    // Obtém tokens atualizados
    const tokens = await this.gerarTokens();
    
    // Usa correlationId fornecido ou gera um novo
    const finalCorrelationId = correlationId || uuidv4();

    return {
      headers: {
        Authorization: `Bearer ${tokens.oauthToken}`,
        'x-itau-apikey': tokens.apiKey,
        'x-itau-correlationID': finalCorrelationId,
        'Content-Type': 'application/json',
      },
    };
  }

  /**
   * Cria um novo boleto na API do Itaú usando a estrutura oficial
   * 
   * @param dadosBoleto Dados do boleto no formato oficial da API Itaú
   * @param correlationId Opcional - ID de correlação customizado
   * @param gerarPDF Opcional - Se true, gera PDF automaticamente após criar boleto
   * @returns Resposta da API com dados do boleto criado e PDF (se solicitado)
   */
  async criarBoletoItau(
    dadosBoleto: DadosBoletoItau,
    correlationId?: string,
    gerarPDF: boolean = true
  ): Promise<BoletoItauResponse & { pdf?: Buffer }> {
    try {
      // Prepara requisição autenticada
      const config = await this.prepararRequisicaoAutenticada(correlationId);

      // Log do payload para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n📤 Payload sendo enviado para API:');
        console.log(JSON.stringify(dadosBoleto, null, 2));
        console.log('');
      }

      // Faz requisição POST para criar boleto
      const response = await this.axiosInstance.post<BoletoItauResponse>(
        '/boletos',
        dadosBoleto,
        config
      );

      const resposta = response.data;

      // Gera PDF automaticamente se solicitado
      if (gerarPDF) {
        try {
          // IMPORTANTE: Mescla dados enviados com resposta da API
          // Isso garante que valores enviados (como valor_titulo) sejam usados no PDF
          // mesmo que a API sandbox retorne valores de teste fixos
          const respostaComDadosOriginais = this.mesclarDadosOriginais(resposta, dadosBoleto);
          
          const pdfBuffer = await this.pdfGenerator.gerarPDFDeBoleto(respostaComDadosOriginais);
          return {
            ...resposta,
            pdf: pdfBuffer,
          };
        } catch (pdfError) {
          console.warn('Erro ao gerar PDF (boleto criado com sucesso):', pdfError);
          // Retorna resposta mesmo se PDF falhar
          return resposta;
        }
      }

      return resposta;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erro ao criar boleto: ${error.response?.status} - ${error.response?.statusText} - ` +
          `${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Mescla dados originais enviados com resposta da API
   * Útil quando a API sandbox retorna valores de teste fixos
   */
  private mesclarDadosOriginais(
    resposta: BoletoItauResponse,
    dadosOriginais: DadosBoletoItau
  ): BoletoItauResponse {
    // Cria uma cópia da resposta
    const respostaMesclada = { ...resposta };

    // Se a resposta tem dados individuais, mescla com os dados originais
    if (respostaMesclada.dado_boleto?.dados_individuais_boleto?.[0] && 
        dadosOriginais.dado_boleto?.dados_individuais_boleto?.[0]) {
      
      const original = dadosOriginais.dado_boleto.dados_individuais_boleto[0];
      const respostaIndividual = respostaMesclada.dado_boleto.dados_individuais_boleto[0];

      // Preserva valores importantes da resposta (nosso número, código de barras, linha digitável)
      // mas usa valores originais enviados (valor, data vencimento, etc)
      respostaMesclada.dado_boleto.dados_individuais_boleto[0] = {
        ...respostaIndividual,
        // Usa valor original enviado (não o valor de teste retornado pela API)
        valor_titulo: original.valor_titulo,
        data_vencimento: original.data_vencimento,
        texto_seu_numero: original.texto_seu_numero,
        data_limite_pagamento: original.data_limite_pagamento,
      };
    }

    // Mescla dados do boleto também
    if (respostaMesclada.dado_boleto && dadosOriginais.dado_boleto) {
      respostaMesclada.dado_boleto = {
        ...respostaMesclada.dado_boleto,
        data_emissao: dadosOriginais.dado_boleto.data_emissao,
        codigo_especie: dadosOriginais.dado_boleto.codigo_especie,
        descricao_especie: dadosOriginais.dado_boleto.descricao_especie,
        codigo_aceite: dadosOriginais.dado_boleto.codigo_aceite,
      };
    }

    return respostaMesclada;
  }

  /**
   * Gera PDF do boleto a partir da resposta da API
   * 
   * @param respostaBoleto Resposta da API com dados do boleto
   * @returns Buffer do PDF gerado
   */
  async gerarPDFBoleto(respostaBoleto: BoletoItauResponse): Promise<Buffer> {
    return await this.pdfGenerator.gerarPDFDeBoleto(respostaBoleto);
  }

  /**
   * Gera PDF do boleto e salva em arquivo
   * 
   * @param respostaBoleto Resposta da API com dados do boleto
   * @param caminhoArquivo Caminho onde salvar o PDF
   */
  async gerarESalvarPDFBoleto(
    respostaBoleto: BoletoItauResponse,
    caminhoArquivo: string
  ): Promise<void> {
    await this.pdfGenerator.gerarESalvarPDF(respostaBoleto, caminhoArquivo);
  }

  /**
   * Cria um novo boleto na API do Itaú (método legado - use criarBoletoItau)
   * 
   * @deprecated Use criarBoletoItau com a estrutura oficial da API
   * @param dadosBoleto Dados do boleto a ser criado
   * @param correlationId Opcional - ID de correlação customizado
   * @returns Resposta da API com dados do boleto criado
   */
  async criarBoleto(
    dadosBoleto: DadosBoleto,
    correlationId?: string
  ): Promise<BoletoResponse> {
    try {
      // Prepara requisição autenticada
      const config = await this.prepararRequisicaoAutenticada(correlationId);

      // Faz requisição POST para criar boleto
      const response = await this.axiosInstance.post<BoletoResponse>(
        '/boletos',
        dadosBoleto,
        config
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erro ao criar boleto: ${error.response?.status} - ${error.response?.statusText} - ` +
          `${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Consulta um boleto pelo número
   * 
   * @param numeroBoleto Número do boleto a ser consultado
   * @param correlationId Opcional - ID de correlação customizado
   * @returns Dados do boleto consultado
   */
  async consultarBoleto(
    numeroBoleto: string,
    correlationId?: string
  ): Promise<BoletoResponse> {
    try {
      // Prepara requisição autenticada
      const config = await this.prepararRequisicaoAutenticada(correlationId);

      // Faz requisição GET para consultar boleto
      const response = await this.axiosInstance.get<BoletoResponse>(
        `/boletos/${numeroBoleto}`,
        config
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erro ao consultar boleto: ${error.response?.status} - ${error.response?.statusText} - ` +
          `${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Faz uma requisição customizada autenticada à API
   * 
   * @param method Método HTTP (GET, POST, PUT, DELETE)
   * @param endpoint Endpoint da API (ex: '/boletos', '/boletos/123')
   * @param data Dados para enviar no body (opcional)
   * @param correlationId Opcional - ID de correlação customizado
   * @returns Resposta da API
   */
  async requisicaoAutenticada<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    correlationId?: string
  ): Promise<T> {
    try {
      // Prepara requisição autenticada
      const config = await this.prepararRequisicaoAutenticada(correlationId);

      // Faz requisição conforme método
      let response;
      switch (method) {
        case 'GET':
          response = await this.axiosInstance.get<T>(endpoint, config);
          break;
        case 'POST':
          response = await this.axiosInstance.post<T>(endpoint, data, config);
          break;
        case 'PUT':
          response = await this.axiosInstance.put<T>(endpoint, data, config);
          break;
        case 'DELETE':
          response = await this.axiosInstance.delete<T>(endpoint, config);
          break;
        case 'PATCH':
          response = await this.axiosInstance.patch<T>(endpoint, data, config);
          break;
        default:
          throw new Error(`Método HTTP não suportado: ${method}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erro na requisição ${method} ${endpoint}: ${error.response?.status} - ` +
          `${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Limpa o cache do token OAuth (útil para forçar renovação)
   */
  limparCache(): void {
    this.authService.clearCache();
    this.initialized = false;
  }

  /**
   * Retorna informações sobre o status do serviço
   */
  getStatus(): {
    initialized: boolean;
    hasOAuthToken: boolean;
    oauthTokenExpiresAt: Date | null;
  } {
    const cacheInfo = this.authService.getCacheInfo();
    return {
      initialized: this.initialized,
      hasOAuthToken: cacheInfo.hasToken,
      oauthTokenExpiresAt: cacheInfo.expiresAt ? new Date(cacheInfo.expiresAt) : null,
    };
  }

  /**
   * Retorna o gerenciador de API Key (para busca automática)
   */
  getApiKeyManager(): ApiKeyManager {
    return this.apiKeyManager;
  }

  /**
   * Fecha recursos (útil para cleanup)
   */
  async fecharRecursos(): Promise<void> {
    await this.pdfGenerator.fecharBrowser();
  }
}
