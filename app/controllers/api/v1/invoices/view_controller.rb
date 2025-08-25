# frozen_string_literal: true

class InternalApi::V1::Invoices::ViewController < InternalApi::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :invoice

  def show
    invoice.viewed! if invoice.sent?
    Invoices::EventTrackerService.new("view", invoice, params).process
    render :show, locals: { invoice:, stripe_connected_account: }
  end

  private

    def invoice
      @_invoice ||= find_invoice_by_external_view_key
      @_invoice ? @_invoice : render_invoice_not_found
    end

    def find_invoice_by_external_view_key
      Invoice.kept.includes(:client, :invoice_line_items).find_by(external_view_key: params[:id])
    end

    def render_invoice_not_found
      render json: { error: "No invoice found" }, status: 422
    end

    def stripe_connected_account
      invoice.company.stripe_connected_account
    end
end
