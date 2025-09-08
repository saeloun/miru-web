
# frozen_string_literal: true

class Api::V1::Reports::OutstandingOverdueInvoicesController < Api::V1::ApplicationController
  def index
    authorize :report

    report_data = Reports::OutstandingOverdueInvoices::ReportDecorator.new(current_company).process

    render :index, locals: report_data, status: 200
  end

  def download
    authorize :report

    send_data Reports::OutstandingOverdueInvoices::DownloadService.new(params, current_company).process
  end
end
