# frozen_string_literal: true

class InternalApi::V1::GenerateInvoiceController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: GenerateInvoicePolicy
    render :index, locals: { current_company: }, status: :ok
  end

  def show
    authorize :show, policy_class: GenerateInvoicePolicy
    pagy, new_line_item_entries = pagy(client.new_line_item_entries, items: 50)
    render json: { client:, new_line_item_entries:, pagy: pagy_metadata(pagy) }, status: :ok
  end

  private

    def client
      @_client ||= Client.find(params[:id])
    end
end
