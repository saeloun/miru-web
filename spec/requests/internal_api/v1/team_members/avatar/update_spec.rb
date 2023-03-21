# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TeamMembers::AvatarController::#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:user) { create(:user, :with_avatar, current_workspace_id: company.id) }
  let(:user2) { create(:user, :with_avatar, current_workspace_id: company2.id) }

  context "when Owner wants to update avatar of employee of his company" do
    before do
      create(:employment, user: admin, company: company)
      create(:employment, user: user, company: company)

      owner.add_role :owner, company
      user.add_role :employee, company
      sign_in owner

      file = Rack::Test::UploadedFile.new(Rails.root.join('spec/support/fixtures/files/test-image.png'), 'image/png')
      send_request :put, internal_api_v1_team_avatar_path(
        team_id: user.id,
        user: {
          # avatar: fixture_file_upload(Rails.root.join('spec', 'support', 'fixtures', 'test-image.png'), 'image/png')
          avatar: fixture_file_upload(Rails.root.join('spec', 'support', 'fixtures', 'test-image.png'), 'image/png')
          # avatar: file,
        }), headers: auth_headers(owner)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      # it { is_expected.to be_an_instance_of(ActiveStorage::Attached::One) }
      # it { is_expected.to have_one(:avatar_attachment) }
    end
  end
end
