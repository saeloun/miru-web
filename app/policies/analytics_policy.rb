# frozen_string_literal: true

class AnalyticsPolicy < ApplicationPolicy
  def index?
    self_analytics_access?
  end

  def revenue_forecast?
    financial_analytics_access?
  end

  def comparison?
    financial_analytics_access?
  end

  def team_productivity?
    self_analytics_access?
  end

  def client_analysis?
    financial_analytics_access?
  end

  def expense_trends?
    financial_analytics_access?
  end

  private

    def company_analytics_access?
      user_owner_role? || user_admin_role?
    end

    def financial_analytics_access?
      company_analytics_access? || user_book_keeper_role?
    end

    def self_analytics_access?
      financial_analytics_access? || user_employee_role?
    end
end
