# frozen_string_literal: true

require "rails_helper"

RSpec.describe CreateCompanyService do
  describe "#process" do
    let(:user) { create(:user) }
    let(:company_params) { attributes_for(:company, name: "Launch Co") }

    it "creates the company, ownership, and notification preference" do
      company = described_class.new(user, params: company_params).process

      expect(company).to be_persisted
      expect(company.name).to eq("Launch Co")
      expect(user.reload.current_workspace_id).to eq(company.id)
      expect(user.has_role?(:owner, company)).to be(true)
      expect(NotificationPreference.find_by(user_id: user.id, company_id: company.id)).to be_present
    end
  end
end
