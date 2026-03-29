# frozen_string_literal: true

require "rails_helper"

RSpec.describe CalendarPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:policy) { described_class.new(user, :calendar) }

  before do
    create(:employment, company:, user:)
  end

  permissions :redirect?, :callback?, :calendars?, :events? do
    %i[owner admin book_keeper employee client].each do |role|
      it "permits #{role}" do
        user.add_role(role, company)

        expect(described_class).to permit(user, :calendar)

        user.remove_role(role, company)
      end
    end
  end
end
