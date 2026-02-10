import * as fs from 'fs';
import * as path from 'path';
import { BoletoItauResponse } from '../types/boleto-itau.types';
import { BoletoDataMapper, DadosTemplateBoleto } from '../utils/boleto-data-mapper';
import { BarcodeGenerator } from '../utils/barcode-generator';

/**
 * Serviço para preencher template HTML do boleto com dados reais
 */
export class BoletoTemplateService {
  private templatePath: string;
  private templateCache: string | null = null;

  constructor() {
    this.templatePath = path.join(__dirname, '../client/template_html/index.html');
  }

  /**
   * Carrega o template HTML do arquivo
   */
  private carregarTemplate(): string {
    if (this.templateCache) {
      return this.templateCache;
    }

    try {
      this.templateCache = fs.readFileSync(this.templatePath, 'utf-8');
      return this.templateCache;
    } catch (error) {
      throw new Error(`Erro ao carregar template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Preenche o template HTML com dados do boleto
   */
  async preencherTemplate(dadosBoleto: BoletoItauResponse): Promise<string> {
    // Mapeia dados da API para formato do template
    const dadosTemplate = BoletoDataMapper.mapearDados(dadosBoleto);

    // Gera código de barras
    const codigoBarrasBase64 = await BarcodeGenerator.gerarCodigoBarras(dadosTemplate.codigoBarras);
    dadosTemplate.codigoBarrasBase64 = codigoBarrasBase64;

    // Carrega logo
    const logoBase64 = BoletoDataMapper.carregarLogoBase64();
    dadosTemplate.logoBase64 = logoBase64;

    // Carrega template
    let html = this.carregarTemplate();

    // Substitui placeholders pelos dados reais
    html = this.substituirDados(html, dadosTemplate);

    return html;
  }

  /**
   * Substitui placeholders no HTML pelos dados reais
   */
  private substituirDados(html: string, dados: DadosTemplateBoleto): string {
    // Substitui logo
    if (dados.logoBase64) {
      html = html.replace(/src="itau-logo\.svg"/g, `src="${dados.logoBase64}"`);
    }

    // Substitui linha digitável no cabeçalho (duas ocorrências - recibo e ficha)
    const linhaDigitavelRegex = /12345\.12345 12345\.121212 12345\.121212 8 12345678901112/g;
    html = html.replace(linhaDigitavelRegex, dados.linhaDigitavel);

    // Substitui "Recibo do Pagador" - primeira ocorrência
    html = html.replace(/Recibo do Pagador<br>\s*12345\.12345 12345\.121212 12345\.121212 8 12345678901112/, 
      `Recibo do Pagador<br>${dados.linhaDigitavel}`);

    // Local de Pagamento
    html = html.replace(/Lorem ipsum dolor sit amet consectetur adipisicing elit\. Ullam officia labore reprehenderit numquam\s+doloribus ut porro laboriosam itaque ipsa ratione\./g, 
      dados.localPagamento);

    // Data de Vencimento
    html = html.replace(/02\/01\/2001/g, dados.dataVencimento);

    // Beneficiário - Nome e CPF/CNPJ
    html = html.replace(/Fulano de Tal CPF: 123\.456\.789\.10/g, 
      `${dados.beneficiario.nome} ${dados.beneficiario.cpfCnpj ? `CPF/CNPJ: ${dados.beneficiario.cpfCnpj}` : ''}`);

    // Endereço do Beneficiário
    html = html.replace(/Rua Suvaco da Cobra, 9 - Narnia - Amazonas - AM - 69060-000/g, 
      dados.beneficiario.endereco);

    // Agência/Código Beneficiário
    html = html.replace(/123\/54321-01/g, dados.beneficiario.agenciaCodigo);

    // Data do documento
    html = html.replace(/01\/01\/2001/g, dados.dataEmissao);

    // Número do documento
    html = html.replace(/>123</g, `>${dados.numeroDocumento}<`);

    // Espécie doc
    html = html.replace(/>DM</g, `>${dados.especieDoc}<`);

    // Aceite
    html = html.replace(/>N</g, `>${dados.aceite}<`);

    // Data Processamento
    html = html.replace(/Data Processamento[\s\S]*?01\/01\/2001/g, 
      `Data Processamento</p>${dados.dataProcessamento}`);

    // Nosso Número
    html = html.replace(/Nosso Número[\s\S]*?123456789/g, 
      `Nosso Número</p>${dados.nossoNumero}`);

    // Carteira
    html = html.replace(/>157</g, `>${dados.carteira}<`);

    // Valor do Documento
    html = html.replace(/10,99/g, dados.valorFormatado);

    // Instruções
    html = html.replace(/Lorem ipsum dolor sit amet consectetur adipisicing elit\. Ullam officia labore reprehenderit numquam\s+doloribus ut porro laboriosam itaque ipsa ratione\./g, 
      dados.instrucoes || 'Não há instruções especiais.');

    // Nome do Pagador
    html = html.replace(/<b>Nome do Pagador: <\/b> Fulano de Tal 2/g, 
      `<b>Nome do Pagador: </b> ${dados.pagador.nome}`);

    // CPF/CNPJ do Pagador
    html = html.replace(/<b>CPF\/CNPJ: <\/b> 123\.123\.123-00/g, 
      `<b>CPF/CNPJ: </b> ${dados.pagador.cpfCnpj}`);

    // Endereço do Pagador
    html = html.replace(/<b>Endereço: <\/b> Av\. André Araujo, 999 - Aleixo - Amazonas - AM -\s+69060-000/g, 
      `<b>Endereço: </b> ${dados.pagador.endereco}`);

    // Sacador/Avalista (se existir)
    if (dados.sacadorAvalista) {
      html = html.replace(/<b>Sacador\/Avalista: <\/b> Fulano de Tal 2/g, 
        `<b>Sacador/Avalista: </b> ${dados.sacadorAvalista.nome}`);
      html = html.replace(/<b>CPF\/CNPJ: <\/b> 123\.123\.123-00/g, 
        `<b>CPF/CNPJ: </b> ${dados.sacadorAvalista.cpfCnpj}`);
    } else {
      // Remove linha do sacador/avalista se não existir
      html = html.replace(/<tr>[\s\S]*?<td class="sem-borda"><b>Sacador\/Avalista: <\/b>[\s\S]*?<\/tr>/g, '');
    }

    // Código de barras - substitui imagem
    if (dados.codigoBarrasBase64) {
      html = html.replace(/src="codigo-barras\.png"/g, `src="${dados.codigoBarrasBase64}"`);
    }

    return html;
  }

  /**
   * Limpa o cache do template (útil para desenvolvimento)
   */
  limparCache(): void {
    this.templateCache = null;
  }
}
