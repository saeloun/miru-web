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
    %w[accepted expired rotated].each do |state|
      it "rejects a preloaded invitation that was #{state} before the company lock" do
        service = described_class.new(invitation.token)
        service.send(:invitation)
        case state
        when "accepted" then invitation.update!(accepted_at: Time.current)
        when "expired" then invitation.update!(expired_at: 1.minute.ago)
        when "rotated" then invitation.update!(token: Devise.friendly_token)
        end

        expect { service.process }.not_to change(User, :count)
        expect(service.success).to be(false)
        expect(service.error_message).to eq("Invitation expired")
      end
    end

    it "does not accept a second service's cached copy after the first accepts" do
      first = described_class.new(invitation.token)
      second = described_class.new(invitation.token)
      [first, second].each { |service| service.send(:invitation) }
      first.process
      expect(first.success).to be(true)
      accepted_at = invitation.reload.accepted_at
      expect { second.process }.not_to change { invitation.reload.accepted_at }
      expect(second.success).to be(false)
      expect(invitation.reload.accepted_at).to eq(accepted_at)
      expect(company.employments.joins(:user).where(users: { email: invitation.recipient_email }).count).to eq(1)
    end

    context "when the free workspace's seats filled after the invitation was sent" do
      before do
        (3 - company.used_team_seats).times do
          create(:employment, company:, user: create(:user, current_workspace_id: company.id))
        end
      end

      it "rejects a team member invitation without accepting it" do
        service = described_class.new(invitation.token)
        service.process

        expect(service.success).to be(false)
        expect(service.error_message).to eq(
          "This workspace has reached its team member limit. Ask the workspace owner to upgrade before accepting this invitation."
        )
        expect(invitation.reload.accepted_at).to be_nil
        expect(User.exists?(email: invitation.recipient_email)).to be(false)
      end

      it "does not persist invitation acceptance when the seat check rolls back" do
        expect { described_class.new(invitation.token).process }
          .not_to change { RailsEventViewer::Entry.where(name: "Invitations::Accepted").count }
      end

      it "allows a client invitation" do
        invitation.update!(role: :client, client: create(:client, company:))

        service = described_class.new(invitation.token)
        service.process

        expect(service.success).to be(true)
        expect(invitation.reload.accepted_at).to be_present
      end

      it "allows a team member invitation with Pro access" do
        company.update!(plan_tier: "paid")

        service = described_class.new(invitation.token)
        assert_event_reported("Invitations::Accepted") { service.process }

        expect(service.success).to be(true)
        expect(invitation.reload.accepted_at).to be_present
      end
    end

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
