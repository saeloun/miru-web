# frozen_string_literal: true

class InvoicePayment::StripePaymentIntent < ApplicationService
  attr_reader :invoice, :client, :account_id
  attr_accessor :checkout_session, :sessions, :payment_intent_id, :payment_intent

  class PaymentIntentNotFoundError < StandardError
    def initialize(msg = "Payment Intent Not Found Error")
      super
    end
  end

  class PaymentIntentNotSucceededError < StandardError
    def initialize(msg = "Payment Intent Not Succeeded Error")
      super
    end
  end

  def initialize(invoice)
    @invoice = invoice
    @client = @invoice.client
    @account_id = @client.company.stripe_account_id
    @sessions = nil
    @checkout_session = nil
    @payment_intent_id = nil
    @payment_intent = nil
  end

  def process
    retrieve_payment_intent
    @payment_intent
  rescue StandardError => error
    Rails.logger.error error.message
    Rails.logger.error error.backtrace.join("\n")
    nil
  end

  private
    def retrieve_payment_intent
      if @invoice.stripe_payment_intent.present?
        @payment_intent_id = @invoice.stripe_payment_intent
      else
        get_checkout_sessions
        find_invoice_session
        if @checkout_session.nil?
          raise PaymentIntentNotFoundError
        end

        @payment_intent_id = @checkout_session.payment_intent
      end

      @payment_intent = Stripe::PaymentIntent.retrieve(
        @payment_intent_id,
        { stripe_account: @account_id }
      )
    end

    def get_checkout_sessions
      @sessions = Stripe::Checkout::Session.list(
        { customer: client.stripe_id },
        { stripe_account: account_id }
      )
    end

    def find_invoice_session
      sessions.each do |session|
        list_line_items = Stripe::Checkout::Session.list_line_items(
          session.id,
          {},
          { stripe_account: account_id }
        )
        list_line_item = list_line_items.find { |list_line_item| invoice.invoice_number == list_line_item.description }

        if list_line_item.present?
          @checkout_session = session
          break
        end
      end
    end
end
