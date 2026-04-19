# frozen_string_literal: true

class Analytics::RefreshCachedReportsJob < ApplicationJob
  queue_as :default

  def perform(report_ids = nil)
    reports_scope(report_ids).find_each do |report|
      Analytics::QueryService.new(
        report_type: report.report_type,
        company: report.company,
        filters: report.filters
      ).refresh!
    end
  end

  private

    def reports_scope(report_ids)
      scope = AnalyticsReport.includes(:company)
      report_ids.present? ? scope.where(id: Array(report_ids)) : scope
    end
end
