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
        expect(response.body).to include("500 Internal Server Error")
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
end
