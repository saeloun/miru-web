# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Role access redirects", type: :system, js: true do
  let(:company) { create(:company) }

  before do
    with_forgery_protection { visit "/dashboard" }
  end

  context "when user is an employee" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      sign_in(employee)
    end

    it "redirects employee away from team" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_current_path("/time-tracking", wait: 10)
      end
    end

    it "redirects employee away from reports" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_current_path("/time-tracking", wait: 10)
      end
    end
  end

  context "when user is a book keeper" do
    let(:book_keeper) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: book_keeper)
      book_keeper.add_role :book_keeper, company
      sign_in(book_keeper)
    end

    it "redirects book keeper away from team" do
      with_forgery_protection do
        visit "/team"

        expect(page).to have_current_path("/payments", wait: 10)
      end
    end

    it "redirects book keeper away from time tracking" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_current_path("/payments", wait: 10)
      end
    end
  end
end
