# frozen_string_literal: true

class TeamUpdateService
  attr_reader :employment, :user_params, :current_company, :new_role, :user

  def initialize(employment:, user_params:, current_company:, new_role:)
    @current_company = current_company
    @employment = employment
    @user_params = user_params
    @new_role = new_role
    @user = employment.user
  end

  def process
    User.transaction do
      # skip confirmation email as changes are made by admin and it dosen't change email
      user.skip_reconfirmation!
      user.update!(user_params)
      update_company_user_role
    end
  end

  private

    def update_company_user_role
      current_role = current_company_role(user)

      if current_role.present?
        user.remove_role(current_role.name.to_sym, current_company)
      end

      user.add_role(new_role.downcase.to_sym, current_company)
    end

    def current_company_role(user)
      user.roles.find_by(resource: current_company)
    end
end
