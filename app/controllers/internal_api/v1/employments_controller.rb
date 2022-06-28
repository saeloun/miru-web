# frozen_string_literal: true

class InternalApi::V1::EmploymentsController < InternalApi::V1::ApplicationController
  def index
    authorize Employment
    render :index, locals: { users: current_company.users.kept }, status: :ok
  end
end
