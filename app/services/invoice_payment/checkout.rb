# frozen_string_literal: true

module InvoicePayment
  class Checkout < ApplicationService
    def initialize(params)
      @invoice = params[:invoice]
      @company = invoice.client.company
      @client = invoice.client
      @success_url = params[:success_url]
      @cancel_url = params[:cancel_url]
    end

    def process
      Invoice.transaction do
        ensure_client_registered!
        checkout!
      end
    end

    private

      attr_reader :invoice, :company, :client, :success_url, :cancel_url

      def ensure_client_registered!
        return if client.stripe_id?

        client.register_on_stripe!
      end

      def description
        "Invoice from #{company.name} for #{currency} #{invoice.amount} due on #{invoice.due_date}"
      end

      def currency
        company.base_currency
      end

      def checkout!
        Stripe::Checkout::Session.create(
          {
            line_items: [{
              price_data: {
                currency: company.base_currency.downcase,
                product_data: {
                  name: invoice.invoice_number,
                  description:
                },
                unit_amount: calculate_amount
              },
              quantity: 1
            }],
            mode: "payment",
            customer: client.reload.stripe_id,
            success_url:,
            cancel_url:
          })
      end

      def calculate_amount
        zero_decimal_currencies = %w[BIF CLP DJF GNF JPY KMF KRW MGA PYG RWF UGX VND VUV XAF XOF XPF]
        if zero_decimal_currencies.include?(currency)
          amount = invoice.amount.to_i
        else
          amount = (invoice.amount * 100).to_i
        end
      end
  end
end
