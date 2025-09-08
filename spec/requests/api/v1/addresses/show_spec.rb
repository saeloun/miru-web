# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Addresses#show", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:employee2) { create(:user, current_workspace_id: company2.id) }
  let!(:employee_address) { create(:address, addressable_type: "User", addressable_id: employee.id) }
  let!(:employee2_address) { create(:address, addressable_type: "User", addressable_id: employee2.id) }
  let!(:company_address) { company.current_address }
  let!(:company2_address) { company2.current_address }

  before do
    create(:employment, company:, user:)
  end

  context "when logged in user is an Owner" do
    before do
      user.add_role :owner, company
      sign_in user
    end

    context "when user wants to see address of his Company" do
      before do
        send_request :get, api_v1_company_address_path(company, company_address), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(company_address.address_line_1)
        expect(json_response["address_line_2"]).to eq(company_address.address_line_2)
        expect(json_response["city"]).to eq(company_address.city)
        expect(json_response["state"]).to eq(company_address.state)
        expect(json_response["country"]).to eq(company_address.country)
        expect(json_response["pin"]).to eq(company_address.pin)
      end
    end

    context "when user wants to see address of an Employee of his company" do
      before do
        create(:employment, company:, user: employee)
        send_request :get, api_v1_user_address_path(employee, employee_address), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(employee_address.address_line_1)
        expect(json_response["address_line_2"]).to eq(employee_address.address_line_2)
        expect(json_response["city"]).to eq(employee_address.city)
        expect(json_response["state"]).to eq(employee_address.state)
        expect(json_response["country"]).to eq(employee_address.country)
        expect(json_response["pin"]).to eq(employee_address.pin)
      end
    end

    context "when user wants to see address of a Company other than his workspace" do
      before do
        send_request :get, api_v1_company_address_path(company2, company2_address), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to see address of an employee outside his workspace" do
      before do
        send_request :get, api_v1_company_address_path(employee2, employee2_address),
          headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when user wants to see address of an invalid Company address ID" do
      before do
        send_request :get, api_v1_company_address_path(company2, "abc"), headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when user wants to see address of an invalid employee ID" do
      before do
        send_request :get, api_v1_company_address_path(employee2, "abc"), headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when logged in user is an Admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    context "when user wants to see address of his Company" do
      before do
        send_request :get, api_v1_company_address_path(company, company_address), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(company_address.address_line_1)
        expect(json_response["address_line_2"]).to eq(company_address.address_line_2)
        expect(json_response["city"]).to eq(company_address.city)
        expect(json_response["state"]).to eq(company_address.state)
        expect(json_response["country"]).to eq(company_address.country)
        expect(json_response["pin"]).to eq(company_address.pin)
      end
    end

    context "when user wants to see address of an Employee of his company" do
      before do
        create(:employment, company:, user: employee)
        send_request :get, api_v1_user_address_path(employee, employee_address), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(employee_address.address_line_1)
        expect(json_response["address_line_2"]).to eq(employee_address.address_line_2)
        expect(json_response["city"]).to eq(employee_address.city)
        expect(json_response["state"]).to eq(employee_address.state)
        expect(json_response["country"]).to eq(employee_address.country)
        expect(json_response["pin"]).to eq(employee_address.pin)
      end
    end

    context "when user wants to see address of a Company other than his workspace" do
      before do
        send_request :get, api_v1_company_address_path(company2, company2_address), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to see address of an employee outside his workspace" do
      before do
        send_request :get, api_v1_company_address_path(employee2, employee2_address),
          headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when user wants to see address of an invalid Company address ID" do
      before do
        send_request :get, api_v1_company_address_path(company2, "abc"), headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when user wants to see address of an invalid employee ID" do
      before do
        send_request :get, api_v1_company_address_path(employee2, "abc"), headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when logged in user is an Employee" do
    before do
      employee.add_role :employee, company
      sign_in employee
    end

    context "when user wants to see his own Company's address detail" do
      before do
        send_request :get, api_v1_company_address_path(company, company_address),
          headers: auth_headers(employee)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to see his own address detail" do
      before do
        send_request :get, api_v1_user_address_path(employee, employee_address),
          headers: auth_headers(employee)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(employee_address.address_line_1)
        expect(json_response["address_line_2"]).to eq(employee_address.address_line_2)
        expect(json_response["city"]).to eq(employee_address.city)
        expect(json_response["state"]).to eq(employee_address.state)
        expect(json_response["country"]).to eq(employee_address.country)
        expect(json_response["pin"]).to eq(employee_address.pin)
      end
    end

    context "when user wants to see his someone else's address detail" do
     before do
       send_request :get, api_v1_user_address_path(employee2, employee2_address),
         headers: auth_headers(employee)
     end

     it "is forbidden" do
       expect(response).to have_http_status(:forbidden)
     end
   end
  end
end
