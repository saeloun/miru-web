# frozen_string_literal: true

class InternalApi::V1::Reports::AccountsAgingController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index, locals: Reports::AccountsAging::FetchOverdueAmount.process(current_company), status: :ok
  end

  def download
    authorize :report
    send_data Reports::AccountsAging::DownloadService.new(params, current_company).process
  end
end
