
import { Sale } from '../types';

export const generateReceiptHTML = (sale: Sale, type: 'thermal' | 'a4'): string => {
  const isThermal = type === 'thermal';
  const dateStr = new Date(sale.timestamp).toLocaleString('pt-BR');
  
  const itemsHTML = sale.items.map(item => `
    <div class="item">
      <div class="item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-qty">${item.quantity}x R$ ${item.price.toFixed(2)}</span>
      </div>
      <span class="item-total">R$ ${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  const styles = isThermal ? `
    @page { margin: 0; }
    body { 
      width: 58mm; 
      margin: 0; 
      padding: 5mm; 
      font-family: 'Courier New', Courier, monospace; 
      font-size: 10pt; 
      line-height: 1.2;
    }
    .header { text-align: center; margin-bottom: 5mm; }
    .header h1 { font-size: 14pt; margin: 0; }
    .divider { border-top: 1px dashed #000; margin: 3mm 0; }
    .item { display: flex; flex-direction: column; margin-bottom: 2mm; }
    .item-info { display: flex; justify-content: space-between; }
    .item-total { font-weight: bold; align-self: flex-end; }
    .totals { margin-top: 5mm; }
    .totals div { display: flex; justify-content: space-between; margin-bottom: 1mm; }
    .grand-total { font-size: 12pt; font-weight: bold; border-top: 1px solid #000; padding-top: 2mm; }
    .footer { text-align: center; margin-top: 8mm; font-size: 8pt; }
  ` : `
    body { 
      width: 210mm; 
      margin: 20mm auto; 
      font-family: Arial, sans-serif; 
      padding: 20mm;
      border: 1px solid #eee;
    }
    .header { text-align: center; margin-bottom: 10mm; border-bottom: 2px solid #333; padding-bottom: 5mm; }
    .header h1 { color: #333; }
    .sale-info { display: flex; justify-content: space-between; margin-bottom: 10mm; background: #f9f9f9; padding: 5mm; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; }
    th { text-align: left; border-bottom: 2px solid #ddd; padding: 3mm; background: #eee; }
    td { padding: 3mm; border-bottom: 1px solid #eee; }
    .totals { width: 300px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 2mm 0; font-size: 11pt; }
    .grand-total { font-size: 16pt; font-weight: bold; color: #10b981; border-top: 2px solid #333; margin-top: 3mm; }
    .footer { margin-top: 20mm; text-align: center; color: #999; font-size: 10pt; }
  `;

  const layout = isThermal ? `
    <div class="header">
      <h1>VENDEEI</h1>
      <p>Comprovante de Venda</p>
    </div>
    <div class="divider"></div>
    <p>Pedido: #${sale.id}</p>
    <p>Data: ${dateStr}</p>
    ${sale.customerName ? `<p>Cliente: ${sale.customerName}</p>` : ''}
    <div class="divider"></div>
    ${itemsHTML}
    <div class="divider"></div>
    <div class="totals">
      <div><span>Subtotal:</span> <span>R$ ${sale.subtotal.toFixed(2)}</span></div>
      ${sale.discount > 0 ? `<div><span>Desconto:</span> <span>- R$ ${sale.discount.toFixed(2)}</span></div>` : ''}
      ${sale.surcharge > 0 ? `<div><span>Taxa/Acr.:</span> <span>+ R$ ${sale.surcharge.toFixed(2)}</span></div>` : ''}
      <div class="grand-total"><span>TOTAL:</span> <span>R$ ${sale.total.toFixed(2)}</span></div>
    </div>
    <div class="divider"></div>
    <p>PAGAMENTO: ${sale.paymentMethod.toUpperCase()}</p>
    <div class="footer">
      <p>Obrigado pela preferência!</p>
      <p>Desenvolvido por Vendeei</p>
    </div>
  ` : `
    <div class="header">
      <h1>VENDEEI - GESTÃO INTELIGENTE</h1>
      <p>RECEPÇÃO DE PAGAMENTO E COMPROVANTE</p>
    </div>
    <div class="sale-info">
      <div>
        <p><strong>Venda:</strong> #${sale.id}</p>
        <p><strong>Data/Hora:</strong> ${dateStr}</p>
        <p><strong>Método:</strong> ${sale.paymentMethod.toUpperCase()}</p>
      </div>
      <div>
        <p><strong>Cliente:</strong> ${sale.customerName || 'Consumidor Final'}</p>
        <p><strong>Status:</strong> ${sale.status === 'canceled' ? 'ESTORNADA' : 'CONCLUÍDA'}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Qtd.</th>
          <th>Preço Un.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>R$ ${item.price.toFixed(2)}</td>
            <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div><span>Subtotal Bruto:</span> <span>R$ ${sale.subtotal.toFixed(2)}</span></div>
      ${sale.discount > 0 ? `<div style="color: red;"><span>Total de Descontos:</span> <span>- R$ ${sale.discount.toFixed(2)}</span></div>` : ''}
      ${sale.surcharge > 0 ? `<div style="color: #6366f1;"><span>Taxas e Adicionais:</span> <span>+ R$ ${sale.surcharge.toFixed(2)}</span></div>` : ''}
      <div class="grand-total"><span>VALOR TOTAL:</span> <span>R$ ${sale.total.toFixed(2)}</span></div>
    </div>
    <div class="footer">
      <p>Este documento não possui valor fiscal conforme legislação vigente.</p>
      <p>Emitido em ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo #${sale.id}</title>
        <style>${styles}</style>
      </head>
      <body>
        ${layout}
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
};

export const printReceipt = (sale: Sale, type: 'thermal' | 'a4') => {
  const html = generateReceiptHTML(sale, type);
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert('Por favor, permita pop-ups para imprimir o recibo.');
  }
};
