# frozen_string_literal: true

class InternalApi::V1::Reports::ClientRevenuesController < InternalApi::V1::ApplicationController
  def index
    authorize :report

    render :index,
      locals: Reports::ClientRevenues::IndexService.new(params, current_company).process,
      status: :ok
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
      status: :ok
  end
end
