# frozen_string_literal: true

class InternalApi::V1::Clients::InvoicesController < InternalApi::V1::ApplicationController
  before_action :client

  def index
    authorize current_user, policy_class: Clients::InvoicesPolicy
    data = Clients::Invoices::IndexService.new(client, current_company, params).process
    render :index, locals: {
      invoices: data[:invoices_query],
      pagination_details: data[:pagination_details]
    }
  end

  def client
    @_client ||= ClientMember.find_by!(user: current_user).client
  end
end
