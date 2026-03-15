const DEFAULT_BASE_URL = 'https://api-m.paypal.com';

export class PayPalClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(clientId: string, clientSecret: string, baseUrl?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Auth Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Refresh 5 minutes before expiry
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
    return this.accessToken!;
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      params?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params, headers: extraHeaders } = options;
    const token = await this.authenticate();
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      ...extraHeaders,
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 204) return {} as T;

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    return response.json();
  }

  // ── Orders API v2 ──

  async createOrder(data: any): Promise<any> {
    return this.request('/v2/checkout/orders', {
      method: 'POST',
      body: data,
      headers: { 'Prefer': 'return=representation' },
    });
  }

  async getOrder(orderId: string): Promise<any> {
    return this.request(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  }

  async updateOrder(orderId: string, patches: any[]): Promise<any> {
    return this.request(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      body: patches,
    });
  }

  async authorizeOrder(orderId: string, data?: any): Promise<any> {
    return this.request(`/v2/checkout/orders/${encodeURIComponent(orderId)}/authorize`, {
      method: 'POST',
      body: data || {},
      headers: { 'Prefer': 'return=representation' },
    });
  }

  async captureOrder(orderId: string, data?: any): Promise<any> {
    return this.request(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      body: data || {},
      headers: { 'Prefer': 'return=representation' },
    });
  }

  // ── Payments API v2 — Authorizations ──

  async getAuthorization(authId: string): Promise<any> {
    return this.request(`/v2/payments/authorizations/${encodeURIComponent(authId)}`);
  }

  async captureAuthorization(authId: string, data?: any): Promise<any> {
    return this.request(`/v2/payments/authorizations/${encodeURIComponent(authId)}/capture`, {
      method: 'POST',
      body: data || {},
      headers: { 'Prefer': 'return=representation' },
    });
  }

  async reauthorize(authId: string, data?: any): Promise<any> {
    return this.request(`/v2/payments/authorizations/${encodeURIComponent(authId)}/reauthorize`, {
      method: 'POST',
      body: data || {},
      headers: { 'Prefer': 'return=representation' },
    });
  }

  async voidAuthorization(authId: string): Promise<any> {
    return this.request(`/v2/payments/authorizations/${encodeURIComponent(authId)}/void`, {
      method: 'POST',
      body: {},
    });
  }

  // ── Payments API v2 — Captures ──

  async getCapture(captureId: string): Promise<any> {
    return this.request(`/v2/payments/captures/${encodeURIComponent(captureId)}`);
  }

  async refundCapture(captureId: string, data?: any): Promise<any> {
    return this.request(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
      method: 'POST',
      body: data || {},
      headers: { 'Prefer': 'return=representation' },
    });
  }

  // ── Payments API v2 — Refunds ──

  async getRefund(refundId: string): Promise<any> {
    return this.request(`/v2/payments/refunds/${encodeURIComponent(refundId)}`);
  }

  // ── Payouts API v1 ──

  async createPayout(data: any): Promise<any> {
    return this.request('/v1/payments/payouts', {
      method: 'POST',
      body: data,
    });
  }

  async getPayoutBatch(batchId: string, params?: { page?: number; page_size?: number; fields?: string }): Promise<any> {
    return this.request(`/v1/payments/payouts/${encodeURIComponent(batchId)}`, { params });
  }

  async getPayoutItem(itemId: string): Promise<any> {
    return this.request(`/v1/payments/payouts-item/${encodeURIComponent(itemId)}`);
  }

  async cancelPayoutItem(itemId: string): Promise<any> {
    return this.request(`/v1/payments/payouts-item/${encodeURIComponent(itemId)}/cancel`, {
      method: 'POST',
      body: {},
    });
  }

  // ── Invoicing API v2 ──

  async createInvoice(data: any): Promise<any> {
    return this.request('/v2/invoicing/invoices', {
      method: 'POST',
      body: data,
    });
  }

  async listInvoices(params?: { page?: number; page_size?: number; total_required?: boolean; fields?: string }): Promise<any> {
    return this.request('/v2/invoicing/invoices', { params });
  }

  async getInvoice(invoiceId: string): Promise<any> {
    return this.request(`/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`);
  }

  async updateInvoice(invoiceId: string, data: any, sendToRecipient?: boolean): Promise<any> {
    return this.request(`/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`, {
      method: 'PUT',
      body: data,
      params: sendToRecipient !== undefined ? { send_to_recipient: sendToRecipient } : undefined,
    });
  }

  async deleteInvoice(invoiceId: string): Promise<any> {
    return this.request(`/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`, {
      method: 'DELETE',
    });
  }

  async sendInvoice(invoiceId: string, data?: any): Promise<any> {
    return this.request(`/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/send`, {
      method: 'POST',
      body: data || {},
    });
  }

  async sendInvoiceReminder(invoiceId: string, data?: any): Promise<any> {
    return this.request(`/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/remind`, {
      method: 'POST',
      body: data || {},
    });
  }

  async cancelInvoice(invoiceId: string, data?: any): Promise<any> {
    return this.request(`/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/cancel`, {
      method: 'POST',
      body: data || {},
    });
  }

  async recordInvoicePayment(invoiceId: string, data: any): Promise<any> {
    return this.request(`/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/payments`, {
      method: 'POST',
      body: data,
    });
  }

  async searchInvoices(data: any): Promise<any> {
    return this.request('/v2/invoicing/search-invoices', {
      method: 'POST',
      body: data,
    });
  }

  async generateInvoiceNumber(): Promise<any> {
    return this.request('/v2/invoicing/generate-next-invoice-number', {
      method: 'POST',
      body: {},
    });
  }

  // ── Catalog Products API v1 ──

  async createProduct(data: any): Promise<any> {
    return this.request('/v1/catalogs/products', {
      method: 'POST',
      body: data,
      headers: { 'Prefer': 'return=representation' },
    });
  }

  async listProducts(params?: { page?: number; page_size?: number; total_required?: boolean }): Promise<any> {
    return this.request('/v1/catalogs/products', { params });
  }

  async getProduct(productId: string): Promise<any> {
    return this.request(`/v1/catalogs/products/${encodeURIComponent(productId)}`);
  }

  async updateProduct(productId: string, patches: any[]): Promise<any> {
    return this.request(`/v1/catalogs/products/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      body: patches,
    });
  }

  // ── Subscriptions API v1 — Plans ──

  async createPlan(data: any): Promise<any> {
    return this.request('/v1/billing/plans', {
      method: 'POST',
      body: data,
      headers: { 'Prefer': 'return=representation' },
    });
  }

  async listPlans(params?: { product_id?: string; plan_ids?: string; page?: number; page_size?: number; total_required?: boolean }): Promise<any> {
    return this.request('/v1/billing/plans', { params });
  }

  async getPlan(planId: string): Promise<any> {
    return this.request(`/v1/billing/plans/${encodeURIComponent(planId)}`);
  }

  async activatePlan(planId: string): Promise<any> {
    return this.request(`/v1/billing/plans/${encodeURIComponent(planId)}/activate`, {
      method: 'POST',
      body: {},
    });
  }

  async deactivatePlan(planId: string): Promise<any> {
    return this.request(`/v1/billing/plans/${encodeURIComponent(planId)}/deactivate`, {
      method: 'POST',
      body: {},
    });
  }

  // ── Subscriptions API v1 — Subscriptions ──

  async createSubscription(data: any): Promise<any> {
    return this.request('/v1/billing/subscriptions', {
      method: 'POST',
      body: data,
      headers: { 'Prefer': 'return=representation' },
    });
  }

  async getSubscription(subscriptionId: string, params?: { fields?: string }): Promise<any> {
    return this.request(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, { params });
  }

  async updateSubscription(subscriptionId: string, patches: any[]): Promise<any> {
    return this.request(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: 'PATCH',
      body: patches,
    });
  }

  async activateSubscription(subscriptionId: string, data?: any): Promise<any> {
    return this.request(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/activate`, {
      method: 'POST',
      body: data || {},
    });
  }

  async cancelSubscription(subscriptionId: string, data?: any): Promise<any> {
    return this.request(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
      method: 'POST',
      body: data || {},
    });
  }

  async suspendSubscription(subscriptionId: string, data?: any): Promise<any> {
    return this.request(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/suspend`, {
      method: 'POST',
      body: data || {},
    });
  }

  async listSubscriptionTransactions(subscriptionId: string, params: { start_time: string; end_time: string }): Promise<any> {
    return this.request(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/transactions`, { params });
  }

  // ── Customer Disputes API v1 ──

  async listDisputes(params?: { start_time?: string; disputed_transaction_id?: string; page_size?: number; next_page_token?: string; dispute_state?: string }): Promise<any> {
    return this.request('/v1/customer/disputes', { params });
  }

  async getDispute(disputeId: string): Promise<any> {
    return this.request(`/v1/customer/disputes/${encodeURIComponent(disputeId)}`);
  }

  async acceptDisputeClaim(disputeId: string, data?: any): Promise<any> {
    return this.request(`/v1/customer/disputes/${encodeURIComponent(disputeId)}/accept-claim`, {
      method: 'POST',
      body: data || {},
    });
  }

  async escalateDispute(disputeId: string, data?: any): Promise<any> {
    return this.request(`/v1/customer/disputes/${encodeURIComponent(disputeId)}/escalate`, {
      method: 'POST',
      body: data || {},
    });
  }

  async sendDisputeMessage(disputeId: string, data: any): Promise<any> {
    return this.request(`/v1/customer/disputes/${encodeURIComponent(disputeId)}/send-message`, {
      method: 'POST',
      body: data,
    });
  }

  // ── Transaction Search API v1 ──

  async listTransactions(params: { start_date: string; end_date: string; transaction_id?: string; transaction_type?: string; transaction_status?: string; page?: number; page_size?: number; fields?: string }): Promise<any> {
    return this.request('/v1/reporting/transactions', { params });
  }

  async listBalances(params?: { as_of_time?: string; currency_code?: string }): Promise<any> {
    return this.request('/v1/reporting/balances', { params });
  }

  // ── Webhooks API v1 ──

  async createWebhook(data: any): Promise<any> {
    return this.request('/v1/notifications/webhooks', {
      method: 'POST',
      body: data,
    });
  }

  async listWebhooks(params?: { anchor_type?: string }): Promise<any> {
    return this.request('/v1/notifications/webhooks', { params });
  }

  async getWebhook(webhookId: string): Promise<any> {
    return this.request(`/v1/notifications/webhooks/${encodeURIComponent(webhookId)}`);
  }

  async updateWebhook(webhookId: string, patches: any[]): Promise<any> {
    return this.request(`/v1/notifications/webhooks/${encodeURIComponent(webhookId)}`, {
      method: 'PATCH',
      body: patches,
    });
  }

  async deleteWebhook(webhookId: string): Promise<any> {
    return this.request(`/v1/notifications/webhooks/${encodeURIComponent(webhookId)}`, {
      method: 'DELETE',
    });
  }

  // ── Webhook Events API v1 ──

  async listWebhookEvents(params?: { page_size?: number; start_time?: string; end_time?: string; event_type?: string }): Promise<any> {
    return this.request('/v1/notifications/webhooks-events', { params });
  }

  async getWebhookEvent(eventId: string): Promise<any> {
    return this.request(`/v1/notifications/webhooks-events/${encodeURIComponent(eventId)}`);
  }

  async resendWebhookEvent(eventId: string, webhookIds?: string[]): Promise<any> {
    return this.request(`/v1/notifications/webhooks-events/${encodeURIComponent(eventId)}/resend`, {
      method: 'POST',
      body: webhookIds ? { webhook_ids: webhookIds } : {},
    });
  }
}
