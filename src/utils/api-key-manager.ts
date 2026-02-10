import { ConfigLoader } from './config-loader';
import * as readline from 'readline';

/**
 * Gerenciador de API Key com busca automática e configuração assistida
 */
export class ApiKeyManager {
  private configLoader: ConfigLoader;

  constructor() {
    this.configLoader = new ConfigLoader();
  }

  /**
   * Busca a API Key automaticamente de múltiplas fontes
   * 
   * Ordem de busca:
   * 1. Variável de ambiente do sistema (ITAU_API_KEY)
   * 2. Arquivo .env
   * 3. Retorna null se não encontrado
   */
  buscarApiKeyAutomaticamente(): { encontrada: boolean; valor: string | null; fonte: string } {
    const source = this.configLoader.buscarApiKey();

    if (source.value && !this.configLoader.isPlaceholder(source.value)) {
      return {
        encontrada: true,
        valor: source.value,
        fonte: source.source === 'system-env' ? 'Variável de ambiente do sistema' : 'Arquivo .env',
      };
    }

    return {
      encontrada: false,
      valor: null,
      fonte: 'Não encontrada',
    };
  }

  /**
   * Configura a API Key automaticamente no arquivo .env
   */
  configurarApiKey(apiKey: string): void {
    if (!apiKey || this.configLoader.isPlaceholder(apiKey)) {
      throw new Error('API Key inválida ou é um placeholder');
    }

    this.configLoader.salvarVariavel('ITAU_API_KEY', apiKey);
  }

  /**
   * Assistente interativo para configurar a API Key
   */
  async configurarInterativo(): Promise<string | null> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      console.log('\n🔑 Assistente de Configuração de API Key');
      console.log('=' .repeat(60));
      console.log('\nPara obter sua API Key:');
      console.log('1. Acesse https://devportal.itau.com.br');
      console.log('2. Faça login ou crie uma conta');
      console.log('3. Navegue até "Sandbox" ou "Minhas Aplicações"');
      console.log('4. Selecione sua aplicação');
      console.log('5. Copie a API Key\n');

      rl.question('Cole sua API Key aqui (ou pressione Enter para pular): ', (answer) => {
        rl.close();

        const apiKey = answer.trim();

        if (!apiKey) {
          console.log('⚠️  Configuração cancelada. Você pode configurar depois no arquivo .env');
          resolve(null);
          return;
        }

        if (this.configLoader.isPlaceholder(apiKey)) {
          console.log('❌ API Key inválida (parece ser um placeholder)');
          resolve(null);
          return;
        }

        try {
          this.configurarApiKey(apiKey);
          console.log('✅ API Key configurada com sucesso no arquivo .env!');
          resolve(apiKey);
        } catch (error) {
          console.error('❌ Erro ao configurar API Key:', error instanceof Error ? error.message : error);
          resolve(null);
        }
      });
    });
  }

  /**
   * Tenta obter a API Key automaticamente ou oferece assistente
   */
  async obterApiKey(interativo: boolean = false): Promise<string | null> {
    // Tenta buscar automaticamente
    const busca = this.buscarApiKeyAutomaticamente();

    if (busca.encontrada) {
      return busca.valor;
    }

    // Se não encontrou e modo interativo está ativado
    if (interativo) {
      return await this.configurarInterativo();
    }

    return null;
  }
}
