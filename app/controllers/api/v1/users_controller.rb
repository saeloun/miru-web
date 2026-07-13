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
          locale: current_user.locale,
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
          "tax_id",
          "timesheet_edit_days"
        )&.merge(
          "address" => current_company&.current_address,
          "logo" => current_company&.company_logo,
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

  def destroy
    target_user = User.find(params[:id])
    authorize target_user, policy_class: SuperAdminUserPolicy

    sole_owner_companies = sole_owner_companies_for(target_user)
    if sole_owner_companies.exists?
      render json: {
        errors: I18n.t(
          "user.super_admin_delete.sole_owner",
          companies: sole_owner_companies.pluck(:name).join(", ")
        )
      }, status: 422

      return
    end

    Audited::Audit.create!(
      auditable: target_user,
      associated: current_company,
      user: current_user,
      action: "super_admin_delete",
      audited_changes: {
        actor_id: current_user.id,
        actor_email: current_user.email,
        target_user_id: target_user.id,
        target_user_email: target_user.email,
        occurred_at: Time.current.iso8601
      },
      comment: "Super admin permanently deleted user"
    )

    target_user.destroy!

    render json: {
      notice: I18n.t("user.super_admin_delete.success", email: target_user.email)
    }, status: 200
  end

  private

    def sole_owner_companies_for(user)
      owner_company_ids = user.roles.where(name: "owner", resource_type: "Company").pluck(:resource_id)
      return Company.none if owner_company_ids.blank?

      sole_owner_company_ids = Role.joins(:users)
        .where(name: "owner", resource_type: "Company", resource_id: owner_company_ids)
        .where(users: { discarded_at: nil })
        .group(:resource_id)
        .having("COUNT(users.id) = 1")
        .pluck(:resource_id)

      Company.where(id: sole_owner_company_ids).order(:name)
    end
end
