# frozen_string_literal: true

class InternalApi::V1::GenerateInvoiceController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: GenerateInvoicePolicy
    render :index, locals: { current_company: current_company }, status: :ok
  end
end
