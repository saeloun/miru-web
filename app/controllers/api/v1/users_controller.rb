# frozen_string_literal: true

class Api::V1::UsersController < Api::V1::BaseController
  def me
    if current_user
      render json: {
        user: {
          id: current_user.id,
          email: current_user.email,
          first_name: current_user.first_name,
          last_name: current_user.last_name,
          date_of_birth: current_user.date_of_birth,
          phone: current_user.phone,
          personal_email_id: current_user.personal_email_id,
          social_accounts: current_user.social_accounts,
          date_format: current_company&.date_format,
          avatar_url: current_user.avatar.attached? ? url_for(current_user.avatar) : nil,
          confirmed: current_user.confirmed?,
          calendar_enabled: current_user.calendar_enabled,
          calendar_connected: current_user.calendar_connected,
          current_workspace_id: current_user.current_workspace_id
        },
        company: current_company&.attributes&.slice(
          "id",
          "name",
          "base_currency",
          "fiscal_year_end",
          "date_format",
          "business_phone",
          "tax_id"
        )&.merge(
          "pro_access" => current_company&.pro_access?,
          "plan_tier" => current_company&.plan_tier,
          "current_plan_label" => current_company&.current_plan_label,
          "team_member_limit" => current_company&.team_member_limit,
          "used_team_seats" => current_company&.used_team_seats,
          "reserved_team_seats" => current_company&.reserved_team_seats,
          "team_member_limit_reached" => current_company&.team_member_limit_reached?
        ),
        company_role: current_user.roles.find_by(resource: current_company)&.name
      }
    else
      render json: { user: nil, company: nil, company_role: nil }, status: 401
    end
  end
end
