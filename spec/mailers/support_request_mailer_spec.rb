# frozen_string_literal: true

require "rails_helper"

RSpec.describe SupportRequestMailer do
  let(:user) { create(:user, email: "member@saeloun.com") }

  it "addresses and renders the workspace request" do
    mail = described_class.with(
      user_id: user.id,
      workspace_name: "Saeloun",
      plan_label: "paid",
      seat_count: 8,
      role: "admin",
      subject: "Need help",
      message: "Please help with billing.",
      priority: true
    ).request

    expect(mail.to).to eq(["hello@saeloun.com"])
    expect(mail.reply_to).to eq([user.email])
    expect(mail.subject).to eq("[Priority] Need help")
    expect(mail.body.encoded).to include(
      "Workspace: Saeloun",
      "Plan: paid",
      "Seats: 8",
      "Role: admin",
      "Please help with billing."
    )
  end
end
