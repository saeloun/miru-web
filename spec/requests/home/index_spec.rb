# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Root#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  # Now conditional routing is handled from fromtend.

  context "when unauthenticated" do
    it "wont throw any error as it acts a root controller" do
      send_request :get, root_path
      expect(response).to be_successful
    end
  end
end
