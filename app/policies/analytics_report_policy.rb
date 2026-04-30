# frozen_string_literal: true

class AnalyticsReportPolicy < ApplicationPolicy
  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      return scope.none unless analytics_access?

      allowed_report_type_values = allowed_report_types.map { |report_type| AnalyticsReport.report_types.fetch(report_type) }

      scope.where(company_id: user.current_workspace_id, report_type: allowed_report_type_values)
    end

    private

      def analytics_access?
        AnalyticsPolicy.new(user, :analytics).index?
      end

      def allowed_report_types
        policy = AnalyticsPolicy.new(user, :analytics)
        types = []
        types << "revenue_forecast" if policy.revenue_forecast?
        types << "team_productivity" if policy.team_productivity?
        types << "client_analysis" if policy.client_analysis?
        types << "expense_trends" if policy.expense_trends?
        types
      end
  end

  def index?
    AnalyticsPolicy.new(user, :analytics).index?
  end

  def show?
    readable_in_workspace? && report_type_access?
  end

  def create?
    case record.report_type.to_s
    when "revenue_forecast"
      AnalyticsPolicy.new(user, :analytics).revenue_forecast?
    when "team_productivity"
      AnalyticsPolicy.new(user, :analytics).team_productivity?
    when "client_analysis"
      AnalyticsPolicy.new(user, :analytics).client_analysis?
    when "expense_trends"
      AnalyticsPolicy.new(user, :analytics).expense_trends?
    else
      false
    end
  end

  def destroy?
    readable_in_workspace? && record.created_by_id == user.id
  end

  private

    def readable_in_workspace?
      AnalyticsPolicy.new(user, :analytics).index? &&
        record.company_id == user.current_workspace_id
    end

    def report_type_access?
      case record.report_type.to_s
      when "revenue_forecast"
        AnalyticsPolicy.new(user, :analytics).revenue_forecast?
      when "team_productivity"
        AnalyticsPolicy.new(user, :analytics).team_productivity?
      when "client_analysis"
        AnalyticsPolicy.new(user, :analytics).client_analysis?
      when "expense_trends"
        AnalyticsPolicy.new(user, :analytics).expense_trends?
      else
        false
      end
    end
end
