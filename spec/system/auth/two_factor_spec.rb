# frozen_string_literal: true

require "rails_helper"
require "open3"

RSpec.describe "Two-factor browser sign in", type: :system, js: true do
  it "enrolls both factors and verifies trust, revocation, and recovery through the browser" do
    company = create(:company)
    user = create(:user, current_workspace_id: company.id, password: "Password123!")
    create(:employment, company:, user:)
    user.add_role :admin, company
    server = Capybara.current_session.server

    with_forgery_protection do
      output, errors, status = Open3.capture3({
        "MIRU_E2E_BASE_URL" => "http://localhost:#{server.port}",
        "MIRU_E2E_EMAIL" => user.email,
        "MIRU_E2E_PASSWORD" => "Password123!"
      }, "node", Rails.root.join("scripts/ci/authentication_e2e.mjs").to_s)

      expect(status.success?).to eq(true), "#{output}\n#{errors}"
      expect(JSON.parse(output)).to include("recoveryReplayRejected" => true, "pageErrors" => [])
    end
  end
end
