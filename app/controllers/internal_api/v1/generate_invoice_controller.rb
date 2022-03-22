# frozen_string_literal: true

class InternalApi::V1::GenerateInvoiceController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized
  def index
    render :index, locals: { current_company: current_company }, status: :ok
  end
end
