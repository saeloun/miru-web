# frozen_string_literal: true

require "rails_helper"

class TestController < ApplicationController; end

RSpec.describe TestController, type: :controller do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  controller do
    def show
      raise Discard::RecordNotDiscarded.new("Discarded record")
    end
  end

  describe "#record_not_discarded" do
    before do
      routes.draw { get "show" => "test#show" }
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when request is HTML type" do
      it "returns a 500 error page" do
        get :show

        expect(response).to have_http_status(:internal_server_error)
        expect(response.body).to include("We're sorry, but something went wrong (500)")
      end
    end

    context "when request is JSON type" do
      it "returns a 500 error page" do
        get :show, format: :json

        error_message = "Discarded record"
        actual_response = JSON.parse(response.body)
        expect(response).to have_http_status(:internal_server_error)
        expect(actual_response["errors"]).to eq(error_message)
      end
    end
  end
end
