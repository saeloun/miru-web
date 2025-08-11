# frozen_string_literal: true

# # frozen_string_literal: true

# require "rails_helper"

# RSpec.describe "Edit client", type: :system do
#   let(:company) { create(:company) }
#   let(:user) { create(:user, current_workspace_id: company.id) }
#   let!(:client) { create(:client_with_phone_number_without_country_code, company:) }

#   def select_values_from_select_box
#     within("div#country") do
#       find(".react-select-filter__control.css-digfch-control").click
#       find("#react-select-2-option-232").click
#     end

#     within("div#state") do
#       find(".react-select-filter__control.css-digfch-control").click
#       find("#react-select-3-option-1").click
#     end

#     within("div#city") do
#       find(".react-select-filter__control.css-digfch-control").click
#       find("#react-select-4-option-0").click
#     end
#   end

#   before do
#     create(:employment, company:, user:)
#     user.add_role :admin, company
#     sign_in(user)
#   end

#   context "when editing a client" do
#     it "edit the client successfully" do
#       with_forgery_protection do
#         visit "/clients"
#         find(".hoverIcon").hover.click
#         find("#kebabMenu").click()
#         click_button "Edit"

#         fill_in "name", with: "test client"
#         fill_in "email", with: "client@test.com"
#         fill_in "phone", with: "9123456789"
#         select_values_from_select_box
#         fill_in "zipcode", with: "123456"
#         click_button "SAVE CHANGES"

#         expect(page).to have_content("test client")

#         expect(client.reload.name).to eq("test client")
#         expect(client.reload.email).to eq("client@test.com")
#       end
#     end
#   end

#   context "when editing client with invalid values" do
#     it "throws error when entering invalid email" do
#       with_forgery_protection do
#         visit "/clients"

#         find(:css, ".hoverIcon").hover.click
#         find("#kebabMenu").click()
#         click_button "Edit"
#         fill_in "email", with: " "
#         click_button "SAVE CHANGES", disabled: true
#       end
#     end
#   end
# end
