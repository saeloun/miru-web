# frozen_string_literal: true

class InternalApi::V1::Invoices::PaymentsController < InternalApi::V1::ApplicationController
  before_action :load_invoice, only: [:success]
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  after_action :track_event, only: [:success]

  def success
    if InvoicePayment::StripePaymentIntent.new(@invoice).process
      if @invoice.paid?
        PaymentMailer.with(
          invoice_id: @invoice.id,
          subject: "Payment details by #{@invoice.client.name}").payment.deliver_later

        @invoice.send_to_client_email(
          invoice_id: @invoice.id,
          subject: "Payment Confirmation of Invoice #{@invoice.invoice_number} by #{@invoice.client.name}"
        )
        render json: { invoice: @invoice, notice: I18n.t("invoices.payments.success.success") }, status: 200
      else
        render json: { invoice: @invoice, notice: I18n.t("invoices.payments.success.success") }, status: 200
      end
    else
      render json: { error: I18n.t("invoices.payments.success.failure") }, status: :unprocessable_entity
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
end
