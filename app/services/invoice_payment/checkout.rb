# frozen_string_literal: true

module InvoicePayment
  class Checkout < ApplicationService
    attr_accessor :checkout_session

    def initialize(params)
      @invoice = params[:invoice]
      @company = invoice.client.company
      @client = invoice.client
      @success_url = params[:success_url]
      @cancel_url = params[:cancel_url]
      @checkout_session = nil
    end

    def process
      Invoice.transaction do
        ensure_client_registered!
        checkout!
        update_invoice!
      end

      @checkout_session
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
        @checkout_session = Stripe::Checkout::Session.create(
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

      def update_invoice!
        invoice.update!(stripe_payment_intent: @checkout_session.payment_intent)
      end
  end
end
