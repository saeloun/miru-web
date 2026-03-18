# frozen_string_literal: true

module AuthResponsePayload
  private

    def safe_user_payload(user)
      user.as_json(only: [:id, :email, :first_name, :last_name, :current_workspace_id])
    end

    def auth_user_payload(user, include_token: false, include_avatar: false, include_confirmed: false)
      payload = safe_user_payload(user)
      payload[:token] = user.token if include_token
      payload[:avatar_url] = user.avatar_url if include_avatar
      payload[:confirmed] = user.confirmed? if include_confirmed
      payload
    end

    def company_role_payload(user, company)
      user.roles.find_by(resource: company)&.name
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

    def signed_in_payload(user, company:, notice:, include_token: false)
      {
        notice:,
        user: auth_user_payload(user, include_token:),
        company_role: company_role_payload(user, company),
        company: company_payload(company)
      }
    end

    def desktop_signed_in_payload(user, company:, google_oauth_success:)
      {
        user: safe_user_payload(user),
        avatar_url: user.avatar_url,
        company_role: company_role_payload(user, company),
        confirmed_user: user.confirmed?,
        company: company_payload(company),
        google_oauth_success:
      }
    end

    def authenticated_user_payload(user, company:)
      {
        user: auth_user_payload(user, include_token: true, include_avatar: true, include_confirmed: true),
        company_role: company_role_payload(user, company),
        company: company_payload(company)
      }
    end
end
