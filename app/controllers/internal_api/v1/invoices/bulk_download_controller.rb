# frozen_string_literal: true

class InternalApi::V1::Invoices::BulkDownloadController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: Invoices::BulkDownloadPolicy

    BulkInvoiceDownloadJob.perform_later(
      bulk_download_params[:invoice_ids],
      current_company.company_logo,
      bulk_download_params[:download_id],
      root_url,
      current_url_options
    )

    head :accepted
  end

  private

    def current_url_options
      { protocol: request.protocol, host: request.host, port: request.port }
    end

    def bulk_download_params
      params.require(:bulk_invoices).permit(:download_id, invoice_ids: [])
    end
end
