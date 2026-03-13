# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sanitized subset post restore" do
  around do |example|
    original_password = ENV["SANITIZED_SUBSET_TEST_PASSWORD"]
    ENV["SANITIZED_SUBSET_TEST_PASSWORD"] = "password"
    example.run
    ENV["SANITIZED_SUBSET_TEST_PASSWORD"] = original_password
  end

  it "normalizes canonical test account roles and passwords" do
    company = create(:company, id: 2, name: "Saeloun Inc")

    vipul = create(:user, email: "vipul@saeloun.com", current_workspace_id: company.id, password: "secret123", password_confirmation: "secret123")
    sonam = create(:user, email: "sonam@saeloun.com", current_workspace_id: company.id, password: "secret123", password_confirmation: "secret123")
    accounts = create(:user, email: "accounts@saeloun.com", current_workspace_id: company.id, password: "secret123", password_confirmation: "secret123")
    finance = create(:user, email: "finance@example.com", current_workspace_id: company.id, password: "secret123", password_confirmation: "secret123")

    vipul.add_role(:employee, company)
    sonam.add_role(:employee, company)
    accounts.add_role(:admin, company)
    finance.add_role(:employee, company)

    load Rails.root.join("script/data_subsets/post_restore.rb")

    expect(vipul.reload.roles.where(resource: company).pluck(:name)).to eq(["owner"])
    expect(sonam.reload.roles.where(resource: company).pluck(:name)).to eq(["admin"])
    expect(accounts.reload.roles.where(resource: company).pluck(:name)).to eq(["book_keeper"])
    expect(finance.reload.roles.where(resource: company).pluck(:name)).to eq(["client"])

    expect(vipul.valid_password?("password")).to be(true)
    expect(sonam.valid_password?("password")).to be(true)
    expect(accounts.valid_password?("password")).to be(true)
    expect(finance.valid_password?("password")).to be(true)
  end
end
