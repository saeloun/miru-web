# frozen_string_literal: true

class InternalApi::V1::EmploymentsController < InternalApi::V1::ApplicationController
  def index
    authorize Employment
    render :index, locals: { users: current_company.users.kept.order(first_name: :asc) }, status: :ok
  end
end
