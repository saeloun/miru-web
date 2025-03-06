# frozen_string_literal: true

require "rails_helper"

RSpec.describe CreateInvitedUserService do
  let(:user) { create(:user) }
  let(:user1) { create(:user) }
  let(:company) { create(:company) }
  let!(:invitation) { create(:invitation, company:) }

  describe "#initialize" do
    subject { CreateInvitedUserService.new(invitation.token) }

    it "checks preset values in initialize method" do
      expect(subject.token.present?).to be true
      expect(subject.success.present?).to be true
    end
  end

  describe "#process" do
    context "when invited user doesn't exists in application" do
      before do
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process
      end

      it "updates invitation as accepted with timestamp" do
        expect(invitation.reload.accepted_at).not_to be_nil
        expect(invitation.reload.accepted_at.class).to eq(ActiveSupport::TimeWithZone)
      end

      it "creates a new user" do
        expect(User.exists?(email: invitation.recipient_email)).to be_truthy
      end

      it "creates a new user with reset password token" do
        user = User.find_by(email: invitation.recipient_email)
        expect(user.reset_password_sent_at.present?).to be_truthy
        expect(user.reset_password_token.present?).to be_truthy
        expect(@service.new_user).to be_truthy
      end

      it "adds role to the new user" do
        user = User.find_by(email: invitation.recipient_email)
        role = user.roles.first
        expect(role.resource).to eq(invitation.company)
      end

      it "adds new user as company member" do
        user = User.find_by(email: invitation.recipient_email)
        expect(company.employments.pluck(:user_id)).to include(user.id)
      end
    end

    context "when invited user already exists in application" do
      before do
        invitation.update_columns(recipient_email: user.email)
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process
      end

      it "updates invitation as accepted with timestamp" do
        expect(invitation.reload.accepted_at).not_to be_nil
        expect(invitation.reload.accepted_at.class).to eq(ActiveSupport::TimeWithZone)
      end

      it "updates user's current workspace id" do
        expect(user.reload.current_workspace_id).to eq(company.id)
      end

      it "adds role to the existing user" do
        role = user.reload.roles.first
        expect(role.resource).to eq(invitation.company)
      end

      it "adds new user as company member" do
        expect(company.employments.pluck(:user_id)).to include(user.id)
      end
    end

    context "when user invited with different roles" do
      it "assigns employee role to user" do
        invitation.update(role: "employee")
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process

        user = User.find_by(email: invitation.recipient_email)
        role = user.roles.first
        expect(company.employments.pluck(:user_id)).to include(user.id)
        expect(role.resource).to eq(invitation.company)
        expect(role.name).to eq("employee")
      end

      it "assigns owner role to user" do
        invitation.update(role: "owner")
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process

        user = User.find_by(email: invitation.recipient_email)
        role = user.roles.first
        expect(company.employments.pluck(:user_id)).to include(user.id)
        expect(role.resource).to eq(invitation.company)
        expect(role.name).to eq("owner")
      end

      it "assigns admin role to user" do
        invitation.update(role: "admin")
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process

        user = User.find_by(email: invitation.recipient_email)
        role = user.roles.first
        expect(company.employments.pluck(:user_id)).to include(user.id)
        expect(role.resource).to eq(invitation.company)
        expect(role.name).to eq("admin")
      end

      it "assigns book_keeper role to user" do
        invitation.update(role: "book_keeper")
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process

        user = User.find_by(email: invitation.recipient_email)
        role = user.roles.first
        expect(company.employments.pluck(:user_id)).to include(user.id)
        expect(role.resource).to eq(invitation.company)
        expect(role.name).to eq("book_keeper")
      end
    end

    context "when invitation expired" do
      before do
        invitation.update(expired_at: Time.current - 1.day)
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process
      end

      it "returns error when invitation expired" do
        expect(@service.success).to be_falsey
        expect(@service.error_message).to eq("Invitation expired")
      end
    end

    context "when different user accepts invitation" do
      before do
        invitation.update_columns(recipient_email: user.email)
        @service = CreateInvitedUserService.new(invitation.token, user1)
        @service.process
      end

      it "returns error when different user accepts invitation" do
        expect(@service.success).to be_falsey
        expect(@service.error_message).to eq("You are already signed in.")
      end
    end

    context "when invitation has invalid first name and last name" do
      before do
        invitation.update_columns(first_name: "123432", last_name: "343242")
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process
      end

      it "returns first name and last name validation error" do
        expect(@service.success).to be_falsey
        expect(@service.error_message).to eq("Validation failed: First name is invalid, Last name is invalid")
      end
    end

    context "when invitation has invalid recipient email" do
      before do
        invitation.update_columns(recipient_email: "123432")
        @service = CreateInvitedUserService.new(invitation.token)
        @service.process
      end

      it "returns recipient email validation error" do
        expect(@service.success).to be_falsey
        expect(@service.error_message).to eq("Validation failed: Recipient email is invalid")
      end
    end
  end
end
