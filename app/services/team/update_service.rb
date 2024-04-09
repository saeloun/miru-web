# frozen_string_literal: true

module Team
  class UpdateService < ApplicationService
    attr_reader :user_params, :current_company, :new_role, :user, :current_role

    def initialize(user_params:, current_company:, new_role:, user:)
      @user = user
      @user_params = user_params
      @current_company = current_company
      @current_role = user.roles.find_by(resource: current_company)&.name&.to_sym
      @new_role = new_role.downcase.to_sym
    end

    def process
      User.transaction do
        # skip confirmation email as changes are made by admin and it dosen't change email
        user.skip_reconfirmation!
        user.update!(user_params)
        update_company_user_role
        user
      end
    end

    private

      def update_company_user_role
        if current_role.present?
          user.remove_role(current_role, current_company)
        end

        user.add_role(new_role, current_company)
      end
  end
end
