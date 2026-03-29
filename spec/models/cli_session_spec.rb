# frozen_string_literal: true

require "rails_helper"

RSpec.describe CliSession, type: :model do
  describe ".issue_for" do
    it "issues a session that expires in 7 days" do
      company = create(:company)
      user = create(:user, current_workspace_id: company.id)

      cli_session, plain_token = described_class.issue_for(user:, company:)

      expect(plain_token).to be_present
      expect(cli_session.expires_at).to be_within(5.seconds).of(7.days.from_now)
      expect(cli_session.last_used_at).to be_present
    end
  end

  describe ".authenticate" do
    it "extends the expiry when the token is used" do
      company = create(:company)
      user = create(:user, current_workspace_id: company.id)
      cli_session, plain_token = described_class.issue_for(user:, company:)
      original_expires_at = cli_session.expires_at
      authenticated_session = nil

      travel 2.days do
        authenticated_session = described_class.authenticate(plain_token)
        expect(authenticated_session.expires_at).to be_within(5.seconds).of(7.days.from_now)
        expect(authenticated_session.last_used_at).to be_within(5.seconds).of(Time.current)
      end

      expect(cli_session.reload.expires_at).to be > original_expires_at
    end
  end
end
