# frozen_string_literal: true

require "rails_helper"

RSpec.describe UpdateProfileSettingsService do
  describe "#process" do
    let(:user) { create(:user) }

    it "updates without password when current_password is blank" do
      params = ActionController::Parameters.new(first_name: "Updated", current_password: "")
      allow(user).to receive(:update_without_password).with(instance_of(ActionController::Parameters)).and_return(true)

      result = described_class.new(user, params).process

      expect(result).to eq({ res: { notice: "User updated" }, status: :ok })
    end

    it "updates with password when current_password is present" do
      params = ActionController::Parameters.new(password: "password123", password_confirmation: "password123", current_password: "oldpass")
      allow(user).to receive(:update_with_password).with(params).and_return(true)

      result = described_class.new(user, params).process

      expect(result).to eq({ res: { notice: "Password updated" }, status: :ok })
    end

    it "returns errors when update fails" do
      params = ActionController::Parameters.new(first_name: "Updated", current_password: "")
      allow(user).to receive(:update_without_password).and_return(false)
      allow(user).to receive_message_chain(:errors, :full_messages).and_return(["First name is invalid"])

      result = described_class.new(user, params).process

      expect(result).to eq({ res: { errors: ["First name is invalid"] }, status: :unprocessable_content })
    end
  end
end
