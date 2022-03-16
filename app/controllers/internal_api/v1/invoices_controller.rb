# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  def index
    authorize :invoice
    render json: { invoices: invoices }, status: :ok
  end

  private
    def invoices
      current_company.invoices
    end
end
