# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#destroy", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let!(:device_of_user) { create(:device, user_id: user.id, company_id: company.id) }
  let!(:device_of_employee) { create(:device, user_id: employee.id, company_id: company.id) }

  before do
    create(:employment, company:, user:)
    create(:employment, company:, user: employee)
  end

  context "when logged in user is admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    it "allows deleting a device in the same workspace" do
      expect do
        send_request :delete,
          api_v1_user_device_path(user_id: employee.id, id: device_of_employee.id),
          headers: auth_headers(user)
      end.to change(Device, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  context "when logged in user is employee" do
    before do
      user.add_role :employee, company
      sign_in user
    end

    it "allows deleting their own device" do
      expect do
        send_request :delete,
          api_v1_user_device_path(user_id: user.id, id: device_of_user.id),
          headers: auth_headers(user)
      end.to change(Device, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "does not allow deleting another employee device" do
      expect do
        send_request :delete,
          api_v1_user_device_path(user_id: employee.id, id: device_of_employee.id),
          headers: auth_headers(user)
      end.not_to change(Device, :count)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
