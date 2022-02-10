# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#new", type: :request do
  let (:user) { create(:user) }

  context "When authenticated" do
    before do
      sign_in user
      get new_company_path
    end

    it "is successful " do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Setup Org")
    end
  end
end
