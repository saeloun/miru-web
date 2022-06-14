# frozen_string_literal: true

class InternalApi::V1::TeamController < InternalApi::V1::ApplicationController
  helper :all

  def index
    authorize :index, policy_class: TeamPolicy
    query = current_company.users.includes([:avatar_attachment, :roles]).ransack(params[:q])
    team = query.result(distinct: true)
    render :index, locals: { team: }, status: :ok
  end
end
