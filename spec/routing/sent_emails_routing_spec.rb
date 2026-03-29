# frozen_string_literal: true

require "rails_helper"

RSpec.describe "sent_emails routing", type: :routing do
  it "falls back to the app shell instead of mounting letter opener in test" do
    expect(get: "/sent_emails").to route_to(
      controller: "home",
      action: "index",
      path: "sent_emails"
    )
  end
end
