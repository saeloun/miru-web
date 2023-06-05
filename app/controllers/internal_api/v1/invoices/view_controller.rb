# frozen_string_literal: true

class InternalApi::V1::Invoices::ViewController < InternalApi::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def show
    invoice.viewed! if invoice.sent?
    Invoices::EventTrackerService.new("view", invoice, params).process
    render :show, locals: { invoice: }
  end

  def invoice
    @_invoice ||= Invoice.includes(:client, :invoice_line_items).find_by!(external_view_key: params[:id])
  end
end
