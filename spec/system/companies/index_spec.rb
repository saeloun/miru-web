# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies index page", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  
  before do
    create(:employment, company:, user:)
  end

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
      # send_request :get, internal_api_v1_companies_path, headers: auth_headers(user)
    end

    it "returns the list of company's clients and company info" do
      with_forgery_protection do
        visit "/profile/edit"
        
        within('ul.tracking-wider') do
            find('div:nth-child(2) > button').click
        end

        find('a[href="/profile/edit/organization-details"]').click
        sleep 2
        expect(page).to have_content(company.name)
        expect(page).to have_content(company.base_currency)
        # expect(page).to have_content(company.current_address.formatted_address)
      end
    end
  end 
end
42