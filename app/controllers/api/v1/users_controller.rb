# frozen_string_literal: true

class Api::V1::UsersController < Api::V1::BaseController
  skip_before_action :authenticate_user_using_x_auth_token, only: [:me]

  def me
    if current_user
      render json: {
        user: {
          id: current_user.id,
          email: current_user.email,
          first_name: current_user.first_name,
          last_name: current_user.last_name,
          avatar_url: current_user.avatar.attached? ? url_for(current_user.avatar) : nil,
          confirmed: current_user.confirmed?,
          calendar_enabled: current_user.calendar_enabled,
          calendar_connected: current_user.calendar_connected,
          current_workspace_id: current_user.current_workspace_id
        },
        company: current_company&.attributes&.slice("id", "name", "base_currency", "fiscal_year_end", "date_format"),
        company_role: current_user.roles.find_by(resource: current_company)&.name
      }
    else
      render json: { user: nil, company: nil, company_role: nil }, status: 401
    end
  end
end
