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
        subscribed_recipients = recipients_with_role.select do |email|
        user = User.find_by(email:)
        user&.subscribed?("Payment Notifications")
      end
        PaymentMailer.with(
          invoice_id: @invoice.id,
          subject: "Payment details by #{@invoice.client.name}",
          recipients: subscribed_recipients
        ).payment.deliver_later

        client_recipients = @invoice.client.client_members.joins(:user).pluck(:email).select do |email|
          User.find_by(email:)&.subscribed?("Payment Notifications")
        end
        @invoice.send_to_client_email(
          invoice_id: @invoice.id,
          subject: "Payment Confirmation of Invoice #{@invoice.invoice_number} by #{@invoice.client.name}",
          recipients: client_recipients
        )
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

    def track_event
      create_stripe = "create_stripe"
      Invoices::EventTrackerService.new(create_stripe, @invoice, params).process
    end

    def recipients_with_role
      client_company = @invoice.client.company
      client_company.users.with_role([:admin, :owner], client_company).pluck(:email)
    end
end
