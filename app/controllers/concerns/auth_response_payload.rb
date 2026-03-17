# frozen_string_literal: true

module AuthResponsePayload
  private

    def safe_user_payload(user)
      user.as_json(only: [:id, :email, :first_name, :last_name, :current_workspace_id])
    end

    def company_payload(company)
      return nil unless company

      company.attributes.slice(
        "id",
        "name",
        "base_currency",
        "fiscal_year_end",
        "date_format",
        "business_phone",
        "tax_id",
        "plan_tier"
      ).merge(
        "pro_access" => company.pro_access?,
        "current_plan_label" => company.current_plan_label,
        "team_member_limit" => company.team_member_limit,
        "used_team_seats" => company.used_team_seats,
        "reserved_team_seats" => company.reserved_team_seats,
        "team_member_limit_reached" => company.team_member_limit_reached?
      )
    end
end
