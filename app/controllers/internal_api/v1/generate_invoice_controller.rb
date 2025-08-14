# frozen_string_literal: true

class InternalApi::V1::GenerateInvoiceController < InternalApi::V1::ApplicationController
  def index
    authorize client, policy_class: GenerateInvoicePolicy
    render :index,
      locals: GenerateInvoice::NewLineItemsService.process(client, params),
      status: 200
  end

  private

    def client
      @_client ||= Client.find_by(id: params[:client_id])
    end
end
