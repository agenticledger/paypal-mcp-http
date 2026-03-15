import { z } from 'zod';
import { PayPalClient } from './api-client.js';

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (client: PayPalClient, args: any) => Promise<any>;
}

export const tools: ToolDef[] = [
  // ── Orders ──

  {
    name: 'order_create',
    description: 'Create a checkout order',
    inputSchema: z.object({
      data: z.string().describe('order JSON body'),
    }),
    handler: async (client, args) => client.createOrder(JSON.parse(args.data)),
  },
  {
    name: 'order_get',
    description: 'Get order details by ID',
    inputSchema: z.object({
      order_id: z.string().describe('order ID'),
    }),
    handler: async (client, args) => client.getOrder(args.order_id),
  },
  {
    name: 'order_update',
    description: 'Update an order (PATCH operations)',
    inputSchema: z.object({
      order_id: z.string().describe('order ID'),
      patches: z.string().describe('JSON array of patch ops'),
    }),
    handler: async (client, args) => client.updateOrder(args.order_id, JSON.parse(args.patches)),
  },
  {
    name: 'order_authorize',
    description: 'Authorize payment for an order',
    inputSchema: z.object({
      order_id: z.string().describe('order ID'),
      data: z.string().optional().describe('optional request body'),
    }),
    handler: async (client, args) => client.authorizeOrder(args.order_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'order_capture',
    description: 'Capture payment for an order',
    inputSchema: z.object({
      order_id: z.string().describe('order ID'),
      data: z.string().optional().describe('optional request body'),
    }),
    handler: async (client, args) => client.captureOrder(args.order_id, args.data ? JSON.parse(args.data) : undefined),
  },

  // ── Authorizations ──

  {
    name: 'authorization_get',
    description: 'Get authorized payment details',
    inputSchema: z.object({
      authorization_id: z.string().describe('authorization ID'),
    }),
    handler: async (client, args) => client.getAuthorization(args.authorization_id),
  },
  {
    name: 'authorization_capture',
    description: 'Capture an authorized payment',
    inputSchema: z.object({
      authorization_id: z.string().describe('authorization ID'),
      data: z.string().optional().describe('capture details JSON'),
    }),
    handler: async (client, args) => client.captureAuthorization(args.authorization_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'authorization_reauthorize',
    description: 'Reauthorize an authorized payment',
    inputSchema: z.object({
      authorization_id: z.string().describe('authorization ID'),
      data: z.string().optional().describe('reauth details JSON'),
    }),
    handler: async (client, args) => client.reauthorize(args.authorization_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'authorization_void',
    description: 'Void an authorized payment',
    inputSchema: z.object({
      authorization_id: z.string().describe('authorization ID'),
    }),
    handler: async (client, args) => client.voidAuthorization(args.authorization_id),
  },

  // ── Captures ──

  {
    name: 'capture_get',
    description: 'Get captured payment details',
    inputSchema: z.object({
      capture_id: z.string().describe('capture ID'),
    }),
    handler: async (client, args) => client.getCapture(args.capture_id),
  },
  {
    name: 'capture_refund',
    description: 'Refund a captured payment',
    inputSchema: z.object({
      capture_id: z.string().describe('capture ID'),
      data: z.string().optional().describe('refund details JSON'),
    }),
    handler: async (client, args) => client.refundCapture(args.capture_id, args.data ? JSON.parse(args.data) : undefined),
  },

  // ── Refunds ──

  {
    name: 'refund_get',
    description: 'Get refund details by ID',
    inputSchema: z.object({
      refund_id: z.string().describe('refund ID'),
    }),
    handler: async (client, args) => client.getRefund(args.refund_id),
  },

  // ── Payouts ──

  {
    name: 'payout_create',
    description: 'Create a batch payout',
    inputSchema: z.object({
      data: z.string().describe('payout batch JSON body'),
    }),
    handler: async (client, args) => client.createPayout(JSON.parse(args.data)),
  },
  {
    name: 'payout_batch_get',
    description: 'Get payout batch details',
    inputSchema: z.object({
      batch_id: z.string().describe('payout batch ID'),
      page: z.number().optional().describe('page number'),
      page_size: z.number().optional().describe('items per page'),
      fields: z.string().optional().describe('fields to return'),
    }),
    handler: async (client, args) => client.getPayoutBatch(args.batch_id, {
      page: args.page, page_size: args.page_size, fields: args.fields,
    }),
  },
  {
    name: 'payout_item_get',
    description: 'Get payout item details',
    inputSchema: z.object({
      item_id: z.string().describe('payout item ID'),
    }),
    handler: async (client, args) => client.getPayoutItem(args.item_id),
  },
  {
    name: 'payout_item_cancel',
    description: 'Cancel an unclaimed payout item',
    inputSchema: z.object({
      item_id: z.string().describe('payout item ID'),
    }),
    handler: async (client, args) => client.cancelPayoutItem(args.item_id),
  },

  // ── Invoicing ──

  {
    name: 'invoice_create',
    description: 'Create a draft invoice',
    inputSchema: z.object({
      data: z.string().describe('invoice JSON body'),
    }),
    handler: async (client, args) => client.createInvoice(JSON.parse(args.data)),
  },
  {
    name: 'invoices_list',
    description: 'List invoices',
    inputSchema: z.object({
      page: z.number().optional().describe('page number'),
      page_size: z.number().optional().describe('items per page'),
      total_required: z.boolean().optional().describe('include total count'),
      fields: z.string().optional().describe('fields to return'),
    }),
    handler: async (client, args) => client.listInvoices(args),
  },
  {
    name: 'invoice_get',
    description: 'Get invoice details by ID',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
    }),
    handler: async (client, args) => client.getInvoice(args.invoice_id),
  },
  {
    name: 'invoice_update',
    description: 'Fully update an invoice',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
      data: z.string().describe('full invoice JSON body'),
      send_to_recipient: z.boolean().optional().describe('notify recipient'),
    }),
    handler: async (client, args) => client.updateInvoice(args.invoice_id, JSON.parse(args.data), args.send_to_recipient),
  },
  {
    name: 'invoice_delete',
    description: 'Delete a draft invoice',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
    }),
    handler: async (client, args) => client.deleteInvoice(args.invoice_id),
  },
  {
    name: 'invoice_send',
    description: 'Send an invoice to the recipient',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
      data: z.string().optional().describe('send options JSON'),
    }),
    handler: async (client, args) => client.sendInvoice(args.invoice_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'invoice_remind',
    description: 'Send invoice payment reminder',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
      data: z.string().optional().describe('reminder options JSON'),
    }),
    handler: async (client, args) => client.sendInvoiceReminder(args.invoice_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'invoice_cancel',
    description: 'Cancel a sent invoice',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
      data: z.string().optional().describe('cancel options JSON'),
    }),
    handler: async (client, args) => client.cancelInvoice(args.invoice_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'invoice_record_payment',
    description: 'Record external payment for invoice',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
      data: z.string().describe('payment details JSON'),
    }),
    handler: async (client, args) => client.recordInvoicePayment(args.invoice_id, JSON.parse(args.data)),
  },
  {
    name: 'invoices_search',
    description: 'Search invoices by criteria',
    inputSchema: z.object({
      data: z.string().describe('search query JSON'),
    }),
    handler: async (client, args) => client.searchInvoices(JSON.parse(args.data)),
  },
  {
    name: 'invoice_generate_number',
    description: 'Generate next invoice number',
    inputSchema: z.object({}),
    handler: async (client) => client.generateInvoiceNumber(),
  },

  // ── Products ──

  {
    name: 'product_create',
    description: 'Create a catalog product',
    inputSchema: z.object({
      data: z.string().describe('product JSON body'),
    }),
    handler: async (client, args) => client.createProduct(JSON.parse(args.data)),
  },
  {
    name: 'products_list',
    description: 'List catalog products',
    inputSchema: z.object({
      page: z.number().optional().describe('page number'),
      page_size: z.number().optional().describe('items per page'),
      total_required: z.boolean().optional().describe('include total count'),
    }),
    handler: async (client, args) => client.listProducts(args),
  },
  {
    name: 'product_get',
    description: 'Get product details by ID',
    inputSchema: z.object({
      product_id: z.string().describe('product ID'),
    }),
    handler: async (client, args) => client.getProduct(args.product_id),
  },
  {
    name: 'product_update',
    description: 'Update a product (PATCH operations)',
    inputSchema: z.object({
      product_id: z.string().describe('product ID'),
      patches: z.string().describe('JSON array of patch ops'),
    }),
    handler: async (client, args) => client.updateProduct(args.product_id, JSON.parse(args.patches)),
  },

  // ── Plans ──

  {
    name: 'plan_create',
    description: 'Create a billing plan',
    inputSchema: z.object({
      data: z.string().describe('plan JSON body'),
    }),
    handler: async (client, args) => client.createPlan(JSON.parse(args.data)),
  },
  {
    name: 'plans_list',
    description: 'List billing plans',
    inputSchema: z.object({
      product_id: z.string().optional().describe('filter by product'),
      plan_ids: z.string().optional().describe('comma-separated plan IDs'),
      page: z.number().optional().describe('page number'),
      page_size: z.number().optional().describe('items per page'),
      total_required: z.boolean().optional().describe('include total count'),
    }),
    handler: async (client, args) => client.listPlans(args),
  },
  {
    name: 'plan_get',
    description: 'Get billing plan details',
    inputSchema: z.object({
      plan_id: z.string().describe('plan ID'),
    }),
    handler: async (client, args) => client.getPlan(args.plan_id),
  },
  {
    name: 'plan_activate',
    description: 'Activate a billing plan',
    inputSchema: z.object({
      plan_id: z.string().describe('plan ID'),
    }),
    handler: async (client, args) => client.activatePlan(args.plan_id),
  },
  {
    name: 'plan_deactivate',
    description: 'Deactivate a billing plan',
    inputSchema: z.object({
      plan_id: z.string().describe('plan ID'),
    }),
    handler: async (client, args) => client.deactivatePlan(args.plan_id),
  },

  // ── Subscriptions ──

  {
    name: 'subscription_create',
    description: 'Create a subscription',
    inputSchema: z.object({
      data: z.string().describe('subscription JSON body'),
    }),
    handler: async (client, args) => client.createSubscription(JSON.parse(args.data)),
  },
  {
    name: 'subscription_get',
    description: 'Get subscription details',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      fields: z.string().optional().describe('fields to return'),
    }),
    handler: async (client, args) => client.getSubscription(args.subscription_id, { fields: args.fields }),
  },
  {
    name: 'subscription_update',
    description: 'Update a subscription (PATCH)',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      patches: z.string().describe('JSON array of patch ops'),
    }),
    handler: async (client, args) => client.updateSubscription(args.subscription_id, JSON.parse(args.patches)),
  },
  {
    name: 'subscription_activate',
    description: 'Activate a suspended subscription',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      data: z.string().optional().describe('activation details JSON'),
    }),
    handler: async (client, args) => client.activateSubscription(args.subscription_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'subscription_cancel',
    description: 'Cancel a subscription',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      data: z.string().optional().describe('cancellation reason JSON'),
    }),
    handler: async (client, args) => client.cancelSubscription(args.subscription_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'subscription_suspend',
    description: 'Suspend an active subscription',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      data: z.string().optional().describe('suspension reason JSON'),
    }),
    handler: async (client, args) => client.suspendSubscription(args.subscription_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'subscription_transactions',
    description: 'List subscription transactions',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      start_time: z.string().describe('start date ISO 8601'),
      end_time: z.string().describe('end date ISO 8601'),
    }),
    handler: async (client, args) => client.listSubscriptionTransactions(args.subscription_id, {
      start_time: args.start_time, end_time: args.end_time,
    }),
  },

  // ── Disputes ──

  {
    name: 'disputes_list',
    description: 'List customer disputes',
    inputSchema: z.object({
      start_time: z.string().optional().describe('start date ISO 8601'),
      disputed_transaction_id: z.string().optional().describe('filter by txn ID'),
      page_size: z.number().optional().describe('items per page'),
      next_page_token: z.string().optional().describe('pagination cursor'),
      dispute_state: z.string().optional().describe('OPEN, RESOLVED, etc.'),
    }),
    handler: async (client, args) => client.listDisputes(args),
  },
  {
    name: 'dispute_get',
    description: 'Get dispute details by ID',
    inputSchema: z.object({
      dispute_id: z.string().describe('dispute ID'),
    }),
    handler: async (client, args) => client.getDispute(args.dispute_id),
  },
  {
    name: 'dispute_accept_claim',
    description: 'Accept a dispute claim',
    inputSchema: z.object({
      dispute_id: z.string().describe('dispute ID'),
      data: z.string().optional().describe('accept details JSON'),
    }),
    handler: async (client, args) => client.acceptDisputeClaim(args.dispute_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'dispute_escalate',
    description: 'Escalate dispute to PayPal',
    inputSchema: z.object({
      dispute_id: z.string().describe('dispute ID'),
      data: z.string().optional().describe('escalation reason JSON'),
    }),
    handler: async (client, args) => client.escalateDispute(args.dispute_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'dispute_send_message',
    description: 'Send message in a dispute',
    inputSchema: z.object({
      dispute_id: z.string().describe('dispute ID'),
      data: z.string().describe('message JSON body'),
    }),
    handler: async (client, args) => client.sendDisputeMessage(args.dispute_id, JSON.parse(args.data)),
  },

  // ── Reporting ──

  {
    name: 'transactions_list',
    description: 'Search transactions by date range',
    inputSchema: z.object({
      start_date: z.string().describe('start date ISO 8601'),
      end_date: z.string().describe('end date ISO 8601'),
      transaction_id: z.string().optional().describe('filter by txn ID'),
      transaction_type: z.string().optional().describe('txn type filter'),
      transaction_status: z.string().optional().describe('status filter'),
      page: z.number().optional().describe('page number'),
      page_size: z.number().optional().describe('items per page'),
      fields: z.string().optional().describe('fields to return'),
    }),
    handler: async (client, args) => client.listTransactions(args as any),
  },
  {
    name: 'balances_list',
    description: 'Get account balances',
    inputSchema: z.object({
      as_of_time: z.string().optional().describe('balance as of ISO date'),
      currency_code: z.string().optional().describe('3-letter currency code'),
    }),
    handler: async (client, args) => client.listBalances(args),
  },

  // ── Webhooks ──

  {
    name: 'webhook_create',
    description: 'Create a webhook listener',
    inputSchema: z.object({
      data: z.string().describe('webhook config JSON'),
    }),
    handler: async (client, args) => client.createWebhook(JSON.parse(args.data)),
  },
  {
    name: 'webhooks_list',
    description: 'List webhook listeners',
    inputSchema: z.object({
      anchor_type: z.string().optional().describe('APPLICATION or ACCOUNT'),
    }),
    handler: async (client, args) => client.listWebhooks(args),
  },
  {
    name: 'webhook_get',
    description: 'Get webhook details by ID',
    inputSchema: z.object({
      webhook_id: z.string().describe('webhook ID'),
    }),
    handler: async (client, args) => client.getWebhook(args.webhook_id),
  },
  {
    name: 'webhook_update',
    description: 'Update a webhook (PATCH)',
    inputSchema: z.object({
      webhook_id: z.string().describe('webhook ID'),
      patches: z.string().describe('JSON array of patch ops'),
    }),
    handler: async (client, args) => client.updateWebhook(args.webhook_id, JSON.parse(args.patches)),
  },
  {
    name: 'webhook_delete',
    description: 'Delete a webhook listener',
    inputSchema: z.object({
      webhook_id: z.string().describe('webhook ID'),
    }),
    handler: async (client, args) => client.deleteWebhook(args.webhook_id),
  },

  // ── Webhook Events ──

  {
    name: 'webhook_events_list',
    description: 'List webhook event notifications',
    inputSchema: z.object({
      page_size: z.number().optional().describe('items per page'),
      start_time: z.string().optional().describe('start date ISO 8601'),
      end_time: z.string().optional().describe('end date ISO 8601'),
      event_type: z.string().optional().describe('event type filter'),
    }),
    handler: async (client, args) => client.listWebhookEvents(args),
  },
  {
    name: 'webhook_event_get',
    description: 'Get webhook event details',
    inputSchema: z.object({
      event_id: z.string().describe('event ID'),
    }),
    handler: async (client, args) => client.getWebhookEvent(args.event_id),
  },
  {
    name: 'webhook_event_resend',
    description: 'Resend a webhook event',
    inputSchema: z.object({
      event_id: z.string().describe('event ID'),
      webhook_ids: z.string().optional().describe('comma-separated webhook IDs'),
    }),
    handler: async (client, args) => client.resendWebhookEvent(
      args.event_id,
      args.webhook_ids ? args.webhook_ids.split(',').map((s: string) => s.trim()) : undefined,
    ),
  },
];
