# frozen_string_literal: true

module EmployeeFetchingConcern
  extend ActiveSupport::Concern

  included do
    def set_employees
      @employees = admin? ? current_company_users : [current_user_data]
    end

    private

      def current_company_users
        current_company.employees_without_client_role.select(:id, :first_name, :last_name).order(
          :first_name,
          :last_name)
      end

      def current_user_data
        OpenStruct.new(current_user.slice(:id, :first_name, :last_name))
      end

      def admin?
        @admin ||= current_user.has_any_role?(
          { name: :owner, resource: current_company },
          { name: :admin, resource: current_company })
      end
  end
end
