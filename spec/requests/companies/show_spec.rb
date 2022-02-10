# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#show", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, company_id: company.id) }

  context "When authenticated" do
    before do
      sign_in user
      get company_path
    end

    it "is successful " do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Settings")
      expect(response.body).to include("ORGANIZATION SETTINGS")
    end
  end
end
