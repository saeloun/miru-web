# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompensationReportRun do
  it "cleans up snapshots when either the generating user or the workspace is destroyed" do
    user = create(:user)
    company = create(:company)
    attributes = { created_by: user, payload: { "source" => "synthetic" }, expires_at: 1.hour.from_now }
    workspace_run = described_class.create!(company:, **attributes)
    user_run = described_class.create!(company: user.current_workspace, **attributes)

    company.destroy!
    expect(described_class.exists?(workspace_run.id)).to be(false)
    expect(described_class.exists?(user_run.id)).to be(true)
    user.destroy!
    expect(described_class.exists?(user_run.id)).to be(false)
  end
end
