# frozen_string_literal: true

class InternalApi::V1::Clients::InvoicesController < InternalApi::V1::ApplicationController
  before_action :set_client

  def index
    authorize current_user, policy_class: Clients::InvoicesPolicy
    data = Clients::Invoices::IndexService.new(@client, current_company, params).process
    render :index, locals: {
      invoices: data[:invoices_query],
      pagination_details: data[:pagination_details]
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
      render json: { error: message }, status: :unprocessable_content
    end
end
