import { InvoiceRepository } from '../repositories/invoice.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';
import { OrderRepository } from '../repositories/order.repository';

export class InvoiceService {
  static init() {
    internalEventBus.on(EVENTS.ORDER_COMPLETED, async (order) => {
      logger.info(`Generating consumer invoice for order ${order.id}`);
      try {
        await this.generateOrderInvoice(order);
      } catch (err) {
        logger.error(`Failed to generate invoice for order ${order.id}`, err);
      }
    });
  }

  static async generateOrderInvoice(order: any) {
    const tax = order.tax_amount || 0;
    const subtotal = order.grand_total - tax;
    
    const invoice = await InvoiceRepository.createInvoice({
      invoice_number: `INV-ORD-${order.id.slice(0, 8).toUpperCase()}`,
      reference_id: order.id,
      type: 'CONSUMER_ORDER',
      issued_to: order.profile_id,
      subtotal,
      tax_total: tax,
      discount_total: order.discount_amount || 0,
      grand_total: order.grand_total,
      status: 'ISSUED',
      download_url: `/api/v1/finance/invoices/${order.id}/download`
    });

    internalEventBus.emit(EVENTS.INVOICE_GENERATED, invoice);
    return invoice;
  }

  static async getHtmlInvoice(order_id: string): Promise<string> {
    const order = await OrderRepository.getOrderById(order_id);
    if (!order) throw new Error('Order not found');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #E65100; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #E65100; }
            .row { display: flex; justify-content: space-between; margin-top: 10px; }
            .total { font-weight: bold; font-size: 18px; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">RasoHi</div>
            <div>Order Invoice</div>
          </div>
          <div class="row"><span>Order ID:</span> <span>${order.id}</span></div>
          <div class="row"><span>Date:</span> <span>${new Date(order.created_at || Date.now()).toLocaleString()}</span></div>
          <br/><br/>
          <div class="row"><span>Subtotal:</span> <span>₹${(order.grand_total - (order.tax_amount || 0)).toFixed(2)}</span></div>
          <div class="row"><span>Tax (GST):</span> <span>₹${(order.tax_amount || 0).toFixed(2)}</span></div>
          <div class="row"><span>Discount:</span> <span>-₹${(order.discount_amount || 0).toFixed(2)}</span></div>
          <div class="row total"><span>Grand Total:</span> <span>₹${order.grand_total.toFixed(2)}</span></div>
          <br/><br/>
          <div style="text-align:center; color:#888; font-size: 12px;">This is a computer generated invoice.</div>
        </body>
      </html>
    `;
    return html;
  }

  static async getConsumerInvoices(profile_id: string) {
    return InvoiceRepository.getInvoices(profile_id);
  }
}

InvoiceService.init();
