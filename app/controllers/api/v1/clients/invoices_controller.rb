# frozen_string_literal: true

class Api::V1::Clients::InvoicesController < Api::V1::ApplicationController
  before_action :set_client

  def index
    authorize current_user, policy_class: Clients::InvoicesPolicy

    # Apply filtering
    invoices = @client.invoices.kept.includes(:company)

    # Handle legacy ransack-style params
    if params[:q].present?
      if params[:q][:status_eq].present?
        invoices = invoices.where(status: params[:q][:status_eq])
      end
      if params[:q][:invoice_number_cont].present?
        invoices = invoices.where("invoice_number ILIKE ?", "%#{params[:q][:invoice_number_cont]}%")
      end
    end

    invoices_query = invoices.order(invoice_number: :desc)

    # Apply pagination
    pagy, paginated_invoices = pagy(invoices_query, items: params[:items] || 10)

    render :index, locals: {
      invoices: paginated_invoices,
      pagination_details: pagy_metadata(pagy)
    }
  end

  private

    def set_client
      @client ||= find_client
      render_error_response("No clients associated") unless @client
    end

    def find_client
      client_member = ClientMember.find_by(user: current_user, company: current_company)
      client_member&.client
    end

    def render_error_response(message)
      render json: { error: message }, status: 422
    end
end
