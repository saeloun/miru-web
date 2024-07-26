# frozen_string_literal: true

class InternalApi::V1::Reports::TimeEntriesController < InternalApi::V1::ApplicationController
  def index
    authorize :report

    reports_data = Reports::TimeEntries::ReportService.new(params, current_company, get_filters: true).process
    render :index,
      locals: reports_data,
      status: :ok
  end

  def download
    authorize :report

    send_data Reports::TimeEntries::DownloadService.new(params, current_company).process
  end

  def share
    authorize :report

    recipients = params[:recipients]
    subject = params[:subject]
    message = params[:message]

    Reports::TimeEntries::DownloadService.new(params, current_company).share_report(recipients, subject, message)
    render json: { message: "Report shared successfully" }, status: :ok
  end
end
