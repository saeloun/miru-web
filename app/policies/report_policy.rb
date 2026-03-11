# frozen_string_literal: true

class ReportPolicy < ApplicationPolicy
  def index?
    report_access_role? && pro_reports_enabled?
  end

  def download?
    report_access_role? && pro_reports_enabled?
  end

  def new?
    (user_owner_role? || user_admin_role?) && pro_reports_enabled?
  end

  private

    def report_access_role?
      user_owner_role? || user_admin_role? || user_book_keeper_role?
    end

    def pro_reports_enabled?
      user.current_workspace&.pro_access?
    end
end
