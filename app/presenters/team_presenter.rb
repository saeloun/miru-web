# frozen_string_literal: true

class TeamPresenter
  attr_reader :team, :invitations, :current_company, :current_user

  def initialize(team, invitations, current_user, current_company)
    @team = team
    @invitations = invitations
    @current_company = current_company
    @current_user = current_user
  end

  def index_data
    {
      teams: formatted_team,
      invitations: formatted_invitations
    }
  end

  private

    def formatted_team
      team.map do |company_user|
          member = company_user.user
          {
            id: member.id,
            # profile_picture: user_avatar(member),
            first_name: member.first_name,
            last_name: member.last_name,
            name: member.full_name,
            email: member.email,
            role: member.primary_role(current_company),
            status: team_member_status(member),
            member:
          }
        end
    end

    def formatted_invitations
      invitations.map do |member|
          {
            # profile_picture: image_url "avatar.svg",
            id: member.id,
            name: member.full_name,
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.recipient_email,
            role: member.role,
            status: invited_user_status
          }
        end
    end

    def team_member_status(member)
      return unless is_current_user_employee && member.unconfirmed_email?

      I18n.t("team.reconfirmation")
    end

    def invited_user_status
      return unless is_current_user_employee

      I18n.t("team.invitation")
    end

    def is_current_user_employee
      is_current_user_employee ||= current_user.has_any_role?(
        { name: :owner, resource: current_company },
        { name: :admin, resource: current_company })
    end
end
