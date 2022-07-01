# frozen_string_literal: true

require "rails_helper"

class TestController < ApplicationController; end

RSpec.describe TestController, type: :controller do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  controller do
    def show
      raise Discard::RecordNotDiscarded.new("Record is corrupted")
    end
  end

  describe "#record_not_discarded" do
    before do
      routes.draw { get "show" => "test#show" }
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when request is HTML type" do
      before do
        get :show
      end

      it "returns a 500 error page" do
        expect(response).to have_http_status(:internal_server_error)
        expect(response.body).to include("We're sorry, but something went wrong (500)")
      end
    end

    context "when request is JSON type" do
      before do
        get :show, format: :json
      end

      it "returns a 500 error page" do
        error_message = "Record is corrupted"
        actual_response = JSON.parse(response.body)
        expect(response).to have_http_status(:internal_server_error)
        expect(actual_response["errors"]).to eq(error_message)
      end
    end
  end

  describe "#company_not_present" do
    before do
      routes.draw { get "show" => "test#show" }
      user.update(current_workspace_id: nil)
      sign_in user
    end

    context "when request is HTML type" do
      before do
        get :show
      end

      it "redirects" do
        expect(response).to have_http_status(:redirect)
      end

      it "redirects to new_company_path" do
        expect(response).to redirect_to(new_company_path)
      end

      it "shows alert You are not authorized to perform this action." do
        expect(flash[:alert]).to eq("You are not authorized to perform this action.")
      end
    end

    context "when request is JSON type" do
      before do
        get :show, format: :json
      end

      it "shows error You are not authorized to perform this action" do
        actual_response = JSON.parse(response.body)
        expect(response).to have_http_status(:forbidden)
        expect(actual_response["errors"]).to eq("You are not authorized to perform this action.")
      end
    end
  end
end
