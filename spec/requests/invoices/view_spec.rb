# frozen_string_literal: true

require "rails_helper"
require "securerandom"

RSpec.describe "Invoices::View", type: :request do
  describe "#show" do
    let(:company) { create(:company, :with_logo) }
    let(:user) { create(:user) }
    let(:client) { create(:client, company:) }
    let(:external_view_key) { "#{SecureRandom.hex}" }
    let(:invoice) { create(:invoice, external_view_key:, client:, company:) }

    context "when unauthenticated" do
      it "is able to view the client invoice successfully" do
        send_request :get, view_invoice_path(external_view_key)
        expect(response).to be_successful
      end
    end
  end
end
