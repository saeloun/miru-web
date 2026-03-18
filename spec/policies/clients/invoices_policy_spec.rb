# frozen_string_literal: true

require "rails_helper"

RSpec.describe Clients::InvoicesPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }

  before do
    client_user.add_role :client, company
    admin.add_role :admin, company
  end

  permissions :index? do
    it "permits client users" do
      expect(described_class).to permit(client_user, client_user)
    end

    it "forbids non-client users" do
      expect(described_class).not_to permit(admin, admin)
    end
  end
end
