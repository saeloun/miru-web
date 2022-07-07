# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Details#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let(:employment) { create(:employment, user:, company:) }

  context "when Owner wants to update details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request(
        :patch, "/internal_api/v1/team/#{employment.id}/details",
        params: {
          user: {
            first_name: Faker::Name.first_name,
            last_name: Faker::Name.first_name,
            phone: Faker::PhoneNumber.phone_number_with_country_code,
            date_of_birth: Date.today,
            personal_email_id: Faker::Internet.safe_email
          }
        })
    end

    it "is successful" do
      user.reload
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Admin wants to update details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request(
        :patch, "/internal_api/v1/team/#{employment.id}/details",
        params: {
          user: {
            first_name: Faker::Name.first_name,
            last_name: Faker::Name.first_name,
            phone: Faker::PhoneNumber.phone_number_with_country_code,
            date_of_birth: Date.today,
            personal_email_id: Faker::Internet.safe_email
          }
        })
    end

    it "is successful" do
      user.reload
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Employee wants to update his own details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request(
        :patch, "/internal_api/v1/team/#{employment.id}/details",
        params: {
          user: {
            first_name: Faker::Name.first_name,
            last_name: Faker::Name.first_name,
            phone: Faker::PhoneNumber.phone_number_with_country_code,
            date_of_birth: Date.today,
            personal_email_id: Faker::Internet.safe_email
          }
        })
    end

    it "is successful" do
      user.reload
      expect(response).to have_http_status(:ok)
    end
  end

  context "when logged in user wants to update details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      send_request(
        :patch, "/internal_api/v1/team/#{employment2.id}/details",
        params: {
          user: {
            first_name: Faker::Name.first_name,
            last_name: Faker::Name.first_name,
            phone: Faker::PhoneNumber.phone_number_with_country_code,
            date_of_birth: Date.today,
            personal_email_id: Faker::Internet.safe_email
          }
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in user wants to update details of another employee from his own company" do
    before do
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request(
        :patch, "/internal_api/v1/team/#{employment2.id}/details",
        params: {
          user: {
            first_name: Faker::Name.first_name,
            last_name: Faker::Name.first_name,
            phone: Faker::PhoneNumber.phone_number_with_country_code,
            date_of_birth: Date.today,
            personal_email_id: Faker::Internet.safe_email
          }
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Owner wants to update details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      send_request(
        :patch, "/internal_api/v1/team/#{employment2.id}/details",
        params: {
          user: {
            first_name: Faker::Name.first_name,
            last_name: Faker::Name.first_name,
            phone: Faker::PhoneNumber.phone_number_with_country_code,
            date_of_birth: Date.today,
            personal_email_id: Faker::Internet.safe_email
          }
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Admin wants to update details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      send_request(
        :patch, "/internal_api/v1/team/#{employment2.id}/details",
        params: {
          user: {
            first_name: Faker::Name.first_name,
            last_name: Faker::Name.first_name,
            phone: Faker::PhoneNumber.phone_number_with_country_code,
            date_of_birth: Date.today,
            personal_email_id: Faker::Internet.safe_email
          }
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
