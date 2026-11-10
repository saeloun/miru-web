# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::MercurySetup do
  include_context "approved mercury consultant payroll"

  around do |example|
    travel_to(Time.utc(2026, 12, 5, 12)) { example.run }
  end

  %w[bank_name bank_country bank_account_currency].each do |field|
    it "requires declared #{field} before reading or linking a provider beneficiary" do
      details = bank_details.merge("bank_country" => "IN", "bank_account_currency" => "INR").except(field)
      employment.employee_record.update!(private_details: details)
      verified_connection

      expect do
        described_class.new(company).link_recipient!(actor: owner, employment_id: employment.id, recipient_id:)
      end.to raise_error(Payroll::MercuryPayment::Blocked) do |error|
        expect(error.codes).to include("bank_profile_incomplete")
      end
      expect(PayrollMercuryRecipientLink.where(employment:)).to be_empty
      expect(a_request(:get, "#{mercury_base}/recipient/#{recipient_id}")).not_to have_been_made
    end
  end

  it "accepts a declared USD account in India without guessing its currency from the payroll currency" do
    employment.employee_record.update!(private_details: bank_details.merge("bank_account_currency" => "USD"))
    verified_connection

    link = described_class.new(company).link_recipient!(actor: owner, employment_id: employment.id, recipient_id:)
    expect(link.bank_details_digest).to eq(described_class.digest(bank_details.merge("bank_account_currency" => "USD").sort.to_h))
  end
end
