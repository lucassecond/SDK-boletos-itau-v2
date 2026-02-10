import bwipjs from 'bwip-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Utilitário para gerar código de barras em formato de imagem
 */
export class BarcodeGenerator {
  /**
   * Gera código de barras no formato Code 128 (padrão para boletos bancários)
   * Retorna a imagem em base64
   */
  static async gerarCodigoBarras(codigoBarras: string): Promise<string> {
    if (!codigoBarras) {
      throw new Error('Código de barras não fornecido');
    }

    try {
      // Remove espaços e caracteres especiais
      const codigoLimpo = codigoBarras.replace(/\s/g, '');

      // Gera código de barras usando bwip-js
      // Formato Code 128 é comum para boletos bancários brasileiros
      // Para boletos bancários brasileiros, usa-se o formato 'interleaved2of5' ou 'code128'
      const png = await (bwipjs as any).toBuffer({
        bcid: 'code128', // Tipo de código de barras
        text: codigoLimpo,
        scale: 2, // Escala da imagem
        height: 60, // Altura em pixels
        includetext: false, // Não incluir texto abaixo do código
        textxalign: 'center',
      });

      // Converte para base64
      return `data:image/png;base64,${png.toString('base64')}`;
    } catch (error) {
      console.error('Erro ao gerar código de barras:', error);
      // Retorna imagem vazia em caso de erro
      return '';
    }
  }

  /**
   * Gera código de barras e salva em arquivo (opcional)
   */
  static async gerarESalvarCodigoBarras(
    codigoBarras: string,
    caminhoArquivo: string
  ): Promise<void> {
    try {
      const png = await (bwipjs as any).toBuffer({
        bcid: 'code128',
        text: codigoBarras.replace(/\s/g, ''),
        scale: 2,
        height: 60,
        includetext: false,
      });

      fs.writeFileSync(caminhoArquivo, png);
    } catch (error) {
      throw new Error(`Erro ao salvar código de barras: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Verifica se o código de barras é válido (formato básico)
   */
  static validarCodigoBarras(codigoBarras: string): boolean {
    if (!codigoBarras) return false;
    // Código de barras de boleto bancário brasileiro tem 44 dígitos
    const codigoLimpo = codigoBarras.replace(/\s/g, '');
    return codigoLimpo.length === 44 && /^\d+$/.test(codigoLimpo);
  }
}
