# frozen_string_literal: true

module EmployeeFetcher
  extend ActiveSupport::Concern

  def set_employees
    @employees = is_admin? ? current_company_users : [current_user]
  end

  private

    def current_company_users
      current_company.employees_without_client_role.select(:id, :first_name, :last_name).order(:first_name, :last_name)
    end

    def is_admin?
      current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    end
end
