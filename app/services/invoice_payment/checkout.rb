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

      def stripe_connected_account
        StripeConnectedAccount.find_by!(company:)
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
                unit_amount: invoice.unit_amount(company.base_currency)
              },
              quantity: 1
            }],
            mode: "payment",
            customer: client.reload.stripe_id,
            success_url:,
            cancel_url:
          }, {
            stripe_account: stripe_connected_account.account_id
          })
      end
  end
end
