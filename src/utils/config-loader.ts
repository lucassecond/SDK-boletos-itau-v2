import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Resultado da busca de configuração
 */
export interface ConfigSource {
  source: 'env-file' | 'system-env' | 'not-found';
  value: string | null;
}

/**
 * Utilitário para carregar configurações de múltiplas fontes
 */
export class ConfigLoader {
  private envPath: string;

  constructor(envPath: string = '.env') {
    this.envPath = path.resolve(process.cwd(), envPath);
  }

  /**
   * Busca uma variável de ambiente de múltiplas fontes
   * Ordem de prioridade:
   * 1. Variável de ambiente do sistema
   * 2. Arquivo .env
   * 3. null se não encontrado
   */
  buscarVariavel(nomeVariavel: string): ConfigSource {
    // 1. Tenta buscar da variável de ambiente do sistema (maior prioridade)
    const systemEnv = process.env[nomeVariavel];
    if (systemEnv && systemEnv.trim() !== '' && systemEnv !== `seu_${nomeVariavel.toLowerCase()}_aqui`) {
      return {
        source: 'system-env',
        value: systemEnv,
      };
    }

    // 2. Tenta carregar do arquivo .env
    if (fs.existsSync(this.envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(this.envPath, 'utf-8'));
      const envValue = envConfig[nomeVariavel];
      
      if (envValue && envValue.trim() !== '' && envValue !== `seu_${nomeVariavel.toLowerCase()}_aqui`) {
        return {
          source: 'env-file',
          value: envValue,
        };
      }
    }

    // 3. Não encontrado
    return {
      source: 'not-found',
      value: null,
    };
  }

  /**
   * Salva uma variável no arquivo .env
   */
  salvarVariavel(nomeVariavel: string, valor: string): void {
    let envContent = '';

    // Lê conteúdo atual do .env se existir
    if (fs.existsSync(this.envPath)) {
      envContent = fs.readFileSync(this.envPath, 'utf-8');
    }

    // Remove a variável se já existir
    const lines = envContent.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith(`${nomeVariavel}=`) && trimmed !== '';
    });

    // Adiciona a nova variável
    const newLine = `${nomeVariavel}=${valor}`;
    filteredLines.push(newLine);

    // Salva o arquivo
    fs.writeFileSync(this.envPath, filteredLines.join('\n') + '\n', 'utf-8');
  }

  /**
   * Verifica se uma variável está configurada (não é placeholder)
   */
  isPlaceholder(valor: string | null): boolean {
    if (!valor) return true;
    
    const trimmed = valor.trim();
    if (!trimmed) return true;
    
    const lowerValue = trimmed.toLowerCase();
    const placeholders = [
      'sua_api_key_aqui',
      'seu_api_key_aqui',
      'seu_client_id_aqui',
      'seu_client_secret_aqui',
      'seu_',
      'sua_',
    ];

    // Verifica se é exatamente um placeholder ou contém placeholder comum
    return placeholders.some(placeholder => lowerValue === placeholder || lowerValue.includes(placeholder));
  }

  /**
   * Busca API Key de múltiplas fontes automaticamente
   */
  buscarApiKey(): ConfigSource {
    return this.buscarVariavel('ITAU_API_KEY');
  }

  /**
   * Busca todas as credenciais necessárias
   */
  buscarTodasCredenciais(): {
    clientId: ConfigSource;
    clientSecret: ConfigSource;
    apiKey: ConfigSource;
  } {
    return {
      clientId: this.buscarVariavel('ITAU_CLIENT_ID'),
      clientSecret: this.buscarVariavel('ITAU_CLIENT_SECRET'),
      apiKey: this.buscarApiKey(),
    };
  }
}
