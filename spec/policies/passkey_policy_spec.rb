# frozen_string_literal: true

require "rails_helper"

RSpec.describe PasskeyPolicy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:record) { user }

  permissions :index?, :registration_options?, :create?, :update_requirement?, :destroy? do
    it "permits a user to manage their own passkeys" do
      expect(described_class).to permit(user, record)
    end

    it "forbids access to another user's passkeys" do
      other_user = create(:user)

      expect(described_class).not_to permit(user, other_user)
    end
  end
end
