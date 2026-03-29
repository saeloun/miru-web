# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnalyticsController, type: :controller do
  describe "#analytics_company_ids" do
    let(:company) { create(:company) }
    let(:user) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user:)
      allow(controller).to receive(:current_user).and_return(user)
    end

    it "returns an ActiveRecord::Relation (subquery) instead of an Array" do
      # The fix changed pluck(:id) to select(:id) to avoid materializing all IDs
      result = controller.send(:analytics_company_ids)
      expect(result).to be_a(ActiveRecord::Relation)
    end

    it "can be used in WHERE IN subqueries without loading all IDs into memory" do
      result = controller.send(:analytics_company_ids)
      # Should be usable as a subquery in ActiveRecord where clauses
      expect { Client.where(company_id: result).to_sql }.not_to raise_error
    end
  end
end
