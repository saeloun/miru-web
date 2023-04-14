# frozen_string_literal: true

class InternalApi::V1::Invoices::PaymentsController < InternalApi::V1::ApplicationController
  before_action :load_invoice, only: [:success]
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def success
    if InvoicePayment::StripePaymentIntent.new(@invoice).process
      if @invoice.paid?
        PaymentMailer.with(
          invoice: @invoice,
          subject: "Payment details by #{@invoice.client.name}").payment.deliver_later
        render json: { invoice: @invoice, notice: I18n.t("invoices.payments.success.success") }, status: :ok
      else
        render json: { invoice: @invoice, notice: I18n.t("invoices.payments.success.success") }, status: :ok
      end
    else
      render json: { error: I18n.t("invoices.payments.success.failure") }, status: :unprocessable_entity
    end
  end

  private

    def load_invoice
      @invoice = Invoice.includes(client: :company).find(params[:id])
    end
end
