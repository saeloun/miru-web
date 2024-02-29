# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamPresenter do
  let(:company) { create :company }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let!(:invitation) { create(:invitation, company:) }
  let!(:invitation2) { create(:invitation, company:) }

  before do
    create(:employment, company:, user:)
    create(:employment, company:, user: user2)
  end

  describe "index_data" do
    before do
      @data = TeamPresenter.new(User.where(id: [user.id, user2.id]), Invitation.all, user, company).index_data
    end

    it "returns required data of team members" do
      team_member = @data[:teams].first

      expected_keys = [:id, :first_name, :last_name, :email, :role, :status, :member, :employment_type, :joined_at_date]
      expect(team_member.keys).to include(*expected_keys)
      expect(@data[:teams].pluck(:id)).to eq([user.id, user2.id])
    end

    it "returns required data of invitations" do
      team_member = @data[:invitations].first

      expect(team_member).to have_key(:id)
      expect(team_member).to have_key(:first_name)
      expect(team_member).to have_key(:last_name)
      expect(team_member).to have_key(:email)
      expect(team_member).to have_key(:role)
      expect(team_member).to have_key(:status)
      expect(@data[:invitations].pluck(:id)).to eq([invitation.id, invitation2.id])
    end
  end
end
