# frozen_string_literal: true

class Api::V1::TeamMembersController < Api::V1::BaseController
  before_action :set_team_member, only: [:show, :update, :destroy]
  after_action :verify_authorized, except: [:index]

  def index
    team_members = current_company.users.includes(:roles, :avatar_attachment)
    render json: {
      team_members: team_members.map { |tm| serialize_team_member(tm) }
    }, status: 200
  end

  def show
    authorize @team_member
    render json: { team_member: serialize_team_member(@team_member) }, status: 200
  end

  def create
    @team_member = User.new(team_member_params)
    @team_member.companies << current_company
    authorize @team_member

    if @team_member.save
      @team_member.add_role(params[:role] || :employee, current_company)
      render json: {
        team_member: serialize_team_member(@team_member),
        notice: "Team member added successfully"
      }, status: 201
    else
      render json: { errors: @team_member.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @team_member

    if @team_member.update(team_member_params)
      if params[:role].present?
        @team_member.roles_for_company(current_company).destroy_all
        @team_member.add_role(params[:role], current_company)
      end
      render json: {
        team_member: serialize_team_member(@team_member),
        notice: "Team member updated successfully"
      }, status: 200
    else
      render json: { errors: @team_member.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @team_member
    employment = @team_member.employments.find_by(company: current_company)

    if employment&.destroy
      render json: { notice: "Team member removed successfully" }, status: 200
    else
      render json: { errors: ["Failed to remove team member"] }, status: :unprocessable_entity
    end
  end

  private

    def set_team_member
      @team_member = current_company.users.find(params[:id])
    end

    def team_member_params
      params.require(:team_member).permit(:email, :first_name, :last_name, :phone)
    end

    def serialize_team_member(user)
      employment = user.employments.find_by(company: current_company)
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar.attached? ? rails_blob_url(user.avatar) : nil,
        role: user.roles_for_company(current_company).first&.name,
        employment_status: employment&.employment_status,
        designation: employment&.designation,
        joined_at: employment&.joined_at,
        created_at: user.created_at
      }
    end
end
