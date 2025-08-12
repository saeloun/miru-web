# frozen_string_literal: true

class InternalApi::V1::Clients::InvoicesController < InternalApi::V1::ApplicationController
  before_action :set_client

  def index
    authorize current_user, policy_class: Clients::InvoicesPolicy

    # Use ransack for filtering
    invoices = @client.invoices.kept.includes(:company)
    @q = invoices.ransack(params[:q])
    invoices_query = @q.result.order(invoice_number: :desc)

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
