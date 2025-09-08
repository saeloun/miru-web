# frozen_string_literal: true

class Api::V1::Invoices::RecentlyUpdatedController < Api::V1::ApplicationController
  def index
    authorize Invoice, :index?

    # Pagination parameters
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 10).to_i
    per_page = 10 if per_page <= 0 || per_page > 50 # Limit max items per page

    # Get recently updated invoices ordered by updated_at
    invoices = current_company.invoices
      .kept
      .includes(:client)
      .order(updated_at: :desc)

    # Apply status filter if provided
    if params[:status].present?
      invoices = invoices.where(status: params[:status])
    end

    # Apply date range filter if needed
    if params[:days_ago].present?
      days = params[:days_ago].to_i
      invoices = invoices.where("updated_at >= ?", days.days.ago)
    end

    # Paginate results
    begin
      pagy_metadata, paginated_invoices = pagy(invoices, items: per_page, page: page)
    rescue Pagy::OverflowError
      # Return empty if page is out of bounds
      pagy_metadata, paginated_invoices = pagy(invoices.none, items: per_page, page: 1)
    end

    # Format response
    invoices_data = paginated_invoices.map do |invoice|
      {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        base_currency_amount: invoice.base_currency_amount,
        currency: invoice.currency,
        status: invoice.status,
        issue_date: invoice.formatted_issue_date,
        due_date: invoice.formatted_due_date,
        updated_at: invoice.updated_at.strftime("%b %d, %Y at %I:%M %p"),
        client: {
          id: invoice.client.id,
          name: invoice.client.name,
          email: invoice.client.email,
          logo: invoice.client_logo_url,
          currency: invoice.client.currency
        },
        company: {
          name: current_company.name,
          base_currency: current_company.base_currency
        }
      }
    end

    render json: {
      invoices: invoices_data,
      meta: {
        current_page: pagy_metadata.page,
        next_page: pagy_metadata.next,
        prev_page: pagy_metadata.prev,
        total_pages: pagy_metadata.pages,
        total_count: pagy_metadata.count,
        has_more: pagy_metadata.next.present?
      }
    }
  end
end
