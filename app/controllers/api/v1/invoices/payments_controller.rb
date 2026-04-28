# frozen_string_literal: true

class Api::V1::Invoices::PaymentsController < Api::V1::ApplicationController
  before_action :load_invoice, only: [:success]
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  after_action :track_event, only: [:success]

  def success
    if params[:provider] == PaymentsProvider::RAZORPAY_PROVIDER
      if @invoice.paid?
        return render json: {
          invoice: payment_success_invoice_payload,
          notice: I18n.t("invoices.payments.success.success")
        }, status: 200
      end

      return render json: { error: I18n.t("invoices.payments.success.failure") }, status: 422
    end

    if InvoicePayment::StripePaymentIntent.new(@invoice).process
      if @invoice.paid?
        PaymentMailer.with(
          invoice_id: @invoice.id,
          subject: "Payment details by #{@invoice.client.name}").payment.deliver_later

        @invoice.send_to_client_email(
          invoice_id: @invoice.id,
          subject: "Payment Confirmation of Invoice #{@invoice.invoice_number} by #{@invoice.client.name}"
        )
        render json: { invoice: payment_success_invoice_payload, notice: I18n.t("invoices.payments.success.success") }, status: 200
      else
        render json: { invoice: payment_success_invoice_payload, notice: I18n.t("invoices.payments.success.success") }, status: 200
      end
    else
      render json: { error: I18n.t("invoices.payments.success.failure") }, status: 422
    end
  end

  private

    def load_invoice
      @invoice = Invoice.includes(client: :company).find(params[:id])
    end

    def track_event
      create_stripe = "create_stripe"
      Invoices::EventTrackerService.new(create_stripe, @invoice, params).process
    end

    def payment_success_invoice_payload
      @invoice.slice(
        :id,
        :invoice_number,
        :status,
        :amount,
        :amount_due,
        :amount_paid,
        :currency
      )
    end
end
