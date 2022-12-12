# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamUpdateService do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employment) { create(:employment, company:, user:) }
  let(:user_params) { { first_name: "Jane", last_name: "Smith" } }

  describe "#process" do
    subject { described_class.new(employment:, user_params:, current_company: company, new_role: "admin").process }

    it "updates the user's attributes" do
      expect { subject }.to change { employment.user.reload.first_name }.to("Jane").and change {
          employment.user.reload.last_name
        }.to("Smith")
    end

    it "updates the user's role" do
      expect { subject }.to change {
        employment.user.reload.primary_role(company)
      }.from("employee").to("admin")
    end
  end
end
