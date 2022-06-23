# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Profile#show", type: :request do
  let(:user) { create(:user, :with_avatar) }
  let(:company) { create(:company) }

  describe "index action" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_profile_path
    end

    it "fetches user details & avatar" do
      expect(response).to have_http_status(:ok)
      expect(json_response["user"]["avatar_url"]).to eq(url_for(user.avatar))
      expect(json_response["user"]["first_name"]).to eq(user.first_name)
      expect(json_response["user"]["last_name"]).to eq(user.last_name)
    end
  end
end
