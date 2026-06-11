# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::Mappers::Customer do
  describe "#payload" do
    it "maps Miru client fields to a QuickBooks customer payload" do
      client = create(:client, name: "Acme", email: "billing@example.com", phone: "+14155550100", currency: "USD")
      client.current_address.update!(
        address_line_1: "1 Market St",
        address_line_2: "Suite 200",
        city: "San Francisco",
        state: "CA",
        pin: "94105",
        country: "US"
      )

      payload = described_class.new.payload(client)

      expect(payload).to include(
        "DisplayName" => "Acme",
        "PrimaryEmailAddr" => { "Address" => "billing@example.com" },
        "PrimaryPhone" => { "FreeFormNumber" => "+14155550100" },
        "CurrencyRef" => { "value" => "USD" }
      )
      expect(payload["BillAddr"]).to include(
        "Line1" => "1 Market St",
        "Line2" => "Suite 200",
        "City" => "San Francisco",
        "CountrySubDivisionCode" => "CA",
        "PostalCode" => "94105",
        "Country" => "US"
      )
    end
  end
end
