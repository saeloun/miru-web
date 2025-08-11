# frozen_string_literal: true

class Team::IndexDecorator < ApplicationService
  attr_reader :current_company, :current_user, :query

  def initialize(current_company:, current_user:, query: nil)
    @current_company = current_company
    @current_user = current_user
    @query = query
  end

  def process
    {
      combined_data: combined_data
    }
  end

  private

    def combined_data
      data = []
      data.concat(employee_data)
      data.concat(invitation_data)
      data.sort_by { |item| [item[:first_name].to_s.downcase, item[:last_name].to_s.downcase] }
    end

    def employee_data
      employees = current_company.employees_without_client_role
      employees = apply_search_filter(employees) if query.present?

      employees.includes(:roles, employments: :company).filter_map do |user|
        employment = user.employments.kept.find_by(company: current_company)
        next unless employment

        build_employee_data(user, employment)
      end
    end

    def invitation_data
      invitations = current_company.invitations.valid_invitations
      invitations = invitations.where("recipient_email ILIKE ?", "%#{query}%") if query.present?

      invitations.map do |invitation|
        build_invitation_data(invitation)
      end
    end

    def apply_search_filter(employees)
      employees.where(
        "users.first_name ILIKE :query OR users.last_name ILIKE :query OR users.email ILIKE :query",
        query: "%#{query}%"
      )
    end

    def build_employee_data(user, employment)
      {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.full_name,
        email: user.email,
        role: user.roles.where(resource: current_company).first&.name || "employee",
        roles: user.roles.where(resource: current_company).pluck(:name),
        status: "active",
        is_team_member: true,
        type: "employee",
        data_type: "Team",
        member: user,
        employment_type: employment.employment_type,
        joined_at_date: employment.joined_at,
        employment_id: employment.id,
        joined_at: employment.joined_at
      }
    end

    def build_invitation_data(invitation)
      {
        id: invitation.id,
        first_name: invitation.first_name || "",
        last_name: invitation.last_name || "",
        name: "#{invitation.first_name} #{invitation.last_name}".strip,
        email: invitation.recipient_email,
        role: invitation.role,
        roles: [invitation.role],
        status: "pending",
        is_team_member: false,
        type: "invitation",
        data_type: "Invitation",
        invited_at: invitation.created_at
      }
    end
end
