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

    it "redirects employee away from clients" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_current_path("/time-tracking", wait: 10)
      end
    end

    it "redirects employee away from invoices" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_current_path("/time-tracking", wait: 10)
      end
    end

    it "redirects employee away from payments" do
      with_forgery_protection do
        visit "/payments"

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

  context "when user is a client" do
    let(:client_user) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: client_user)
      client_user.add_role :client, company
      sign_in(client_user)
    end

    it "redirects client away from dashboard" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_current_path(%r{\A/invoices(\?.*)?\z}, wait: 10)
      end
    end

    it "redirects client away from clients" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_current_path(%r{\A/invoices(\?.*)?\z}, wait: 10)
      end
    end

    it "redirects client away from billing" do
      with_forgery_protection do
        visit "/settings/billing"

        expect(page).to have_current_path("/error", wait: 10)
      end
    end

    it "hides preferences navigation for clients" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_current_path("/settings/profile", wait: 10)
        expect(page).not_to have_link("Preferences")
      end
    end
  end

  context "when an owner has a profile photo" do
    let(:owner) do
      create(
        :user,
        current_workspace_id: company.id,
        first_name: "Avatar",
        last_name: "Owner",
        email: "avatar.owner@example.com"
      )
    end

    before do
      create(:employment, company:, user: owner)
      owner.add_role :owner, company
      owner.avatar.attach(
        io: Rails.root.join("spec/support/fixtures/test-image.png").open,
        filename: "avatar-owner.png",
        content_type: "image/png"
      )
      sign_in(owner)
    end

    it "shows the profile image in the dashboard sidebar" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_current_path("/dashboard", wait: 10)
        expect(page).to have_css("aside img[alt='Avatar Owner']", wait: 10)
      end
    end
  end
end
