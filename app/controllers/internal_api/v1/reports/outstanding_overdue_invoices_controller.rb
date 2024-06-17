
# frozen_string_literal: true

class InternalApi::V1::Reports::OutstandingOverdueInvoicesController < InternalApi::V1::ApplicationController
  def index
    authorize :report

    report_data = Reports::OutstandingOverdueInvoices::IndexService.new(current_company).process

    render :index, locals: report_data, status: :ok
  end

  def download
    authorize :report

    send_data Reports::OutstandingOverdueInvoices::DownloadService.new(params, current_company).process
  end
end
