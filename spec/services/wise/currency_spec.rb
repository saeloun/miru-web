# frozen_string_literal: true

require "rails_helper"

RSpec.describe Wise::Currency, :wise do
  describe "#list" do
    subject { Wise::Currency.new.list }

    context "when wise api is success", vcr: { cassette_name: "wise_currency_success" } do
      it "returns list of available currency" do
        expect(subject.status).to eq 200
        expect(JSON.parse(subject.body).class).to be Array
      end
    end
  end
end
