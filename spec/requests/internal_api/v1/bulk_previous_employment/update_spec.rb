# frozen_string_literal: true

# # frozen_string_literal: true

# require "rails_helper"
# RSpec.describe "InternalApi::V1::BulkPreviousEmployments#update", type: :request do
#   let(:company) { create(:company) }
#   let(:user) { create(:user, current_workspace_id: company.id) }
#   let(:employment) { create(:employment, company_id: company.id, user_id: user.id) }
#   let(:previous_employment) { create(:previous_employment, user:) }
#   let(:added_employments) { [{ company_name: "ABC Company", role: "Software Engineer" }] }
#   let(:updated_employments) { [{ id: previous_employment.id, company_name: "Updated Company", role: "Updated Role" }] }
#   let(:removed_employment_ids) { [2, 3] }
#   let(:employments) do
#     {
#       added_employments:,
#       updated_employments:,
#       removed_employment_ids:
#     }
#   end

#   before do
#     user.add_role :admin, company
#     user.roles
#     sign_in user
#   end

#   describe "#update" do
#     it "updates previous employments" do
#       send_request :put, internal_api_v1_bulk_previous_employment_path(user), params: {
#         id: user.id, employments:
#       }, headers: auth_headers(user)
#       expect(JSON.parse(response.body)).to include(
#         "notice" => I18n.t("employment.update.success")
#       )
#     end
#   end
# end
