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
      team.map do |user|
          user_info = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            name: user.full_name,
            email: user.email,
            role: user.primary_role(current_company),
            status: team_member_status(user),
            is_team_member: true,
            data_type: "Team",
            member: user
          }
          user_info.merge(employment_data(user))
        end
    end

    def formatted_invitations
      invitations.map do |member|
          {
            id: member.id,
            name: member.full_name,
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.recipient_email,
            role: member.role,
            status: invited_user_status(member),
            is_team_member: false,
            data_type: "Invitation"
          }
        end
    end

    def team_member_status(member)
      user_employed_at_current_company && member.confirmed_at?
    end

    def invited_user_status(member)
      user_employed_at_current_company && member.accepted_at
    end

    def user_employed_at_current_company
      user_employed_at_current_company ||= current_user.has_any_role?(
        { name: :owner, resource: current_company },
        { name: :admin, resource: current_company },
        { name: :employee, resource: current_company },
        { name: :book_keeper, resource: current_company }
        )
    end

    def employment_data(user)
      employment = user.employments.find_by!(company_id: current_company.id)
      {
        employment_type: employment&.employment_type,
        joined_at_date: employment&.joined_at
      }
    end
end
