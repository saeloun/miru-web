# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll staff selectors", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }

  before do
    enable_synthetic_payroll(company.id)
    create(:employment, company:, user: admin, resigned_at: nil)
    admin.add_role(:admin, company)
    sign_in admin
  end

  %w[salary_slips consultant_payroll].each do |endpoint|
    it "keeps #{endpoint} role queries constant as the staff directory grows" do
      role_queries = lambda do
        queries = []
        listener = ->(_name, _start, _finish, _id, payload) { queries << payload[:sql] if payload[:sql].include?('FROM "roles"') }
        ActiveSupport::Notifications.subscribed(listener, "sql.active_record") { get "/api/v1/#{endpoint}" }
        expect(response).to have_http_status(:ok)
        queries.size
      end
      baseline = role_queries.call
      expect(baseline).to be_positive
      4.times do
        user = create(:user, current_workspace: company)
        create(:employment, company:, user:, resigned_at: nil)
        user.add_role(:employee, company)
      end
      expect(role_queries.call).to be <= baseline
      expect(response.parsed_body.fetch("employments").size).to eq(5)
    end
  end
end
