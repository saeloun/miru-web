# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  def index
    authorize Invoice
    pagy, invoices = pagy(
      current_company.invoices.includes(:client)
            .from_date(params[:from])
            .to_date(params[:to])
            .for_clients(params[:client_ids])
            .with_statuses(params[:statuses]),
      items_param: :invoices_per_page)

    render :index, locals: {
      invoices:,
      pagy: pagy_metadata(pagy),
      summary: {
        overdue_amount: current_company.invoices.overdue.sum(:amount),
        outstanding_amount: current_company.invoices.sum(:outstanding_amount),
        draft_amount: current_company.invoices.draft.sum(:amount)
      }
    }
  end
end
