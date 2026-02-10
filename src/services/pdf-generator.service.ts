import puppeteer, { Browser, Page } from 'puppeteer';
import { BoletoItauResponse } from '../types/boleto-itau.types';
import { BoletoTemplateService } from './boleto-template.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Opções para geração de PDF
 */
export interface PDFOptions {
  formato?: 'A4' | 'Letter';
  margem?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
}

/**
 * Serviço para gerar PDF a partir de HTML usando Puppeteer
 */
export class PDFGeneratorService {
  private browser: Browser | null = null;
  private templateService: BoletoTemplateService;

  constructor() {
    this.templateService = new BoletoTemplateService();
  }

  /**
   * Inicializa o navegador Puppeteer (reutiliza instância)
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  /**
   * Fecha o navegador (útil para cleanup)
   */
  async fecharBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Gera PDF a partir de HTML
   */
  async gerarPDF(html: string, opcoes?: PDFOptions): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configura o conteúdo HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Configurações padrão do PDF
      const pdfOptions: any = {
        format: opcoes?.formato || 'A4',
        margin: {
          top: opcoes?.margem?.top || '5mm',
          right: opcoes?.margem?.right || '5mm',
          bottom: opcoes?.margem?.bottom || '5mm',
          left: opcoes?.margem?.left || '5mm',
        },
        printBackground: opcoes?.printBackground !== false,
        preferCSSPageSize: opcoes?.preferCSSPageSize || false,
      };

      // Gera PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      // Converte Uint8Array para Buffer
      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  /**
   * Gera PDF diretamente a partir dos dados do boleto
   * Combina template + PDF em um único método
   */
  async gerarPDFDeBoleto(dadosBoleto: BoletoItauResponse, opcoes?: PDFOptions): Promise<Buffer> {
    // Preenche template com dados do boleto
    const html = await this.templateService.preencherTemplate(dadosBoleto);

    // Gera PDF
    return await this.gerarPDF(html, opcoes);
  }

  /**
   * Salva PDF em arquivo
   */
  async salvarPDF(buffer: Buffer, caminhoArquivo: string): Promise<void> {
    try {
      // Cria diretório se não existir
      const diretorio = path.dirname(caminhoArquivo);
      if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio, { recursive: true });
      }

      // Salva arquivo
      fs.writeFileSync(caminhoArquivo, buffer);
    } catch (error) {
      throw new Error(`Erro ao salvar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Gera PDF e salva em arquivo (método completo)
   */
  async gerarESalvarPDF(
    dadosBoleto: BoletoItauResponse,
    caminhoArquivo: string,
    opcoes?: PDFOptions
  ): Promise<void> {
    const buffer = await this.gerarPDFDeBoleto(dadosBoleto, opcoes);
    await this.salvarPDF(buffer, caminhoArquivo);
  }
}
