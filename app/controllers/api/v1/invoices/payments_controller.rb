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

    if @invoice.paid?
      render json: {
        invoice: payment_success_invoice_payload,
        notice: I18n.t("invoices.payments.success.success")
      }, status: 200
    else
      render json: { error: I18n.t("invoices.payments.success.failure") }, status: 422
    end
  end

  private

    def load_invoice
      @invoice = Invoice.kept.includes(client: :company).find_by!(external_view_key: params[:id])
    end

    def track_event
      event = params[:provider] == PaymentsProvider::PAYPAL_PROVIDER ? "create_paypal" : "create_stripe"
      Invoices::EventTrackerService.new(event, @invoice, params).process
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
