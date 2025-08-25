# frozen_string_literal: true

class Api::V1::GenerateInvoiceController < Api::V1::ApplicationController
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
