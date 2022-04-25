# frozen_string_literal: true

class InternalApi::V1::CompanyUsersController < InternalApi::V1::ApplicationController
  def index
    authorize CompanyUser
    render :index, locals: { users: current_company.users.kept }, status: :ok
  end
end
