# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::RegistrationsController#update", type: :request do
  let(:user) { create(:user, first_name: "Adam", last_name: "Steve") }
  let(:subject) { Users::RegistrationsController.new }

  context "when current password is blank" do
    it "updates user data without password" do
      params = { first_name: "Sam", last_name: "Example" }
      subject.send(:update_resource, user, params)
      expect(user.first_name).to eq("Sam")
      expect(user.last_name).to eq("Example")
    end
  end

  context "when current password is present" do
    it "updates user data with password" do
      params = { first_name: "Text", last_name: "Updated", current_password: "Testing!@" }
      subject.send(:update_resource, user, params)
      expect(user.first_name).to eq("Text")
      expect(user.last_name).to eq("Updated")
    end
  end

  describe "#after_update_path_for" do
    before do
      sign_in user
      send_request :patch, user_registration_path, params: { user: { first_name: "Updated name" } }
    end

    it "returns profile_path after resource is updated" do
      expect(response).to redirect_to(profile_path)
    end
  end
end
