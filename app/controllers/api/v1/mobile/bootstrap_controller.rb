# frozen_string_literal: true

class Api::V1::Mobile::BootstrapController < Api::V1::ApplicationController
  include AuthResponsePayload

  skip_after_action :verify_authorized

  def show
    render json: authenticated_user_payload(current_user, company: current_company).merge(
      capabilities:,
      workspace: workspace_payload
    ), status: 200
  end

  private

    def capabilities
      {
        time_tracking: TimeTrackingPolicy.new(current_user, :index).index?,
        projects: ProjectPolicy.new(current_user, Project).index?,
        expenses: ExpensePolicy.new(current_user, Expense).index?,
        invoices: InvoicePolicy.new(current_user, Invoice).index?,
        payments: PaymentPolicy.new(current_user, :index).index?,
        payment_settings: PaymentSettingsPolicy.new(current_user, :index).index?,
        team: TeamPolicy.new(current_user, :index).index?
      }
    end

    def workspace_payload
      return unless current_company

      {
        id: current_company.id,
        name: current_company.name,
        base_currency: current_company.base_currency,
        date_format: current_company.date_format
      }
    end
end
