# frozen_string_literal: true

class InternalApi::V1::TeamMembers::DetailsController < InternalApi::V1::ApplicationController
  def show
    authorize current_user, policy_class: TeamMembers::DetailPolicy
    employee = Employment.find(params[:team_id])
    user = employee.user
    render :show, locals: { user: }, status: :ok
  end
end
