# frozen_string_literal: true

class InternalApi::V1::Reports::ClientRevenuesController < InternalApi::V1::ApplicationController
  def index
    authorize :report

    render :index,
      locals: Reports::ClientRevenues::ReportDecorator.new(params, current_company).process,
      status: 200
  end

  def download
    authorize :report

    send_data Reports::ClientRevenues::DownloadService.new(params, current_company).process
  end

  def new
    authorize :report

    clients = current_company.billable_clients

    render :new,
      locals: { clients: },
      status: 200
  end
end
