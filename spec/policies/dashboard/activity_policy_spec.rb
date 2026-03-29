# frozen_string_literal: true

require "rails_helper"

RSpec.describe Dashboard::ActivityPolicy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:policy) { described_class.new(user, :activity) }

  before do
    create(:employment, company:, user:)
  end

  %i[owner admin book_keeper employee client].each do |role|
    context "when user is #{role}" do
      before do
        user.add_role(role, company)
      end

      it "allows access" do
        expect(policy.index?).to be true
      end
    end
  end
end
