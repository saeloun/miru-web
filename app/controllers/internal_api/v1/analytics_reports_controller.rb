# frozen_string_literal: true

class InternalApi::V1::AnalyticsReportsController < Api::V1::ApplicationController
  after_action :verify_authorized

  def index
    authorize AnalyticsReport

    reports = policy_scope(AnalyticsReport).includes(:creator).order(created_at: :desc)
    render json: { reports: reports.map { |report| serialize_report(report) } }
  end

  def show
    report = policy_scope(AnalyticsReport).includes(:creator).find(params[:id])
    authorize report

    Analytics::TrackingService.new(user: current_user).track_saved_analytics_report_view(
      report: report,
      company_id: current_company.id
    )

    render json: { report: serialize_report(report) }
  end

  def create
    report = current_company.analytics_reports.new(report_params)
    report.creator = current_user
    authorize report

    if report.save
      render json: { report: serialize_report(report) }, status: :created
    else
      render json: { errors: report.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    report = policy_scope(AnalyticsReport).find(params[:id])
    authorize report

    report.destroy!
    head :no_content
  end

  private

    def report_params
      params.require(:analytics_report).permit(:name, :report_type, filters: {}).to_h
    end

    def serialize_report(report)
      {
        id: report.id,
        name: report.name,
        report_type: report.report_type,
        filters: report.filters,
        created_at: report.created_at.iso8601,
        created_by_id: report.created_by_id,
        creator_name: report.creator.full_name,
        can_delete: report.created_by_id == current_user.id
      }
    end
end
