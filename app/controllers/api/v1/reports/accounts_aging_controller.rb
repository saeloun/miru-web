# frozen_string_literal: true

class Api::V1::Reports::AccountsAgingController < Api::V1::ApplicationController
  def index
    authorize :report
    render :index, locals: Reports::AccountsAging::FetchOverdueAmount.process(current_company), status: 200
  end

  def download
    authorize :report
    send_data Reports::AccountsAging::DownloadService.new(params, current_company).process
  end
end
