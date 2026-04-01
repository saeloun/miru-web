# frozen_string_literal: true

class Api::V1::Invoices::LineItemsController < Api::V1::ApplicationController
  def index
    unless client
      skip_authorization
      return render json: { error: "Client not found" }, status: 404
    end

    authorize client, policy_class: InvoiceLineItemPolicy
    render "api/v1/invoices/line_items/index",
      locals: GenerateInvoice::NewLineItemsService.process(client, params),
      status: 200
  end

  private

    def client
      @_client ||= current_company.clients.find_by(id: params[:client_id])
    end
end
