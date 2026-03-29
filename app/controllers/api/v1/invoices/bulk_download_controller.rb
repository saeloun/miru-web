# frozen_string_literal: true

class Api::V1::Invoices::BulkDownloadController < Api::V1::ApplicationController
  def index
    authorize :index, policy_class: Invoices::BulkDownloadPolicy

    BulkInvoiceDownloadJob.perform_later(
      bulk_download_params[:invoice_ids],
      current_company.company_logo,
      bulk_download_params[:download_id],
      root_url,
      current_url_options
    )
    head 202
  end

  def status
    authorize :status, policy_class: Invoices::BulkDownloadPolicy

    download_status = BulkInvoiceDownloadStatus.find_by(download_id: params[:download_id])
    if download_status
      render json: { status: download_status.status, file_url: download_status.file_url }
    else
      render json: { status: :not_found }
    end
  end

  private

    def current_url_options
      { protocol: request.protocol, host: request.host, port: request.port }
    end

    def bulk_download_params
      params.require(:bulk_invoices).permit(:download_id, invoice_ids: [])
    end
end
