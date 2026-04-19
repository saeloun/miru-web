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

      scope.where(company_id: user.current_workspace_id)
    end

    private

      def analytics_access?
        AnalyticsPolicy.new(user, :analytics).index?
      end
  end

  def index?
    AnalyticsPolicy.new(user, :analytics).index?
  end

  def show?
    readable_in_workspace?
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
end
