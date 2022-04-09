# frozen_string_literal: true

class InternalApi::V1::CompanyUsersController < InternalApi::V1::ApplicationController
  def index
    authorize CompanyUser
    render :index, locals: { users: company_users }, status: :ok
  end
end

private

def company_users
  @company_users = CompanyUser.includes(:user).where(company_id: current_company.id)
    .map do |company_user|
                        {
                          id: company_user.user_id,
                          name: company_user.user.full_name
                        }
                      end
end
