# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Employee bank-change notices", type: :request do
  include_context "approved mercury consultant payroll"

  before do
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
    run
    sign_in worker
  end

  def update_bank(details, **attributes)
    patch "/api/v1/employee_records", params: {
      employee_record: { company_id: company.id, private_details: details }.merge(attributes)
    }, as: :json
  end

  def notices
    PayrollBankChangeNotice.where(employment:)
  end

  it "journals an independently confirmed self-service edit for accounts without returning delivery or bank history" do
    expect do
      update_bank({ bank_account_number: "000123456789" }, bank_account_number_confirmation: "000123456789")
      expect(response).to have_http_status(:ok)
    end.to change { notices.count }.by(2)

    expect(notices.pluck(:recipient_id)).to match_array([owner.id, accounts.id])
    expect(notices.distinct.count(:event_id)).to eq(1)
    expect(response.body).not_to include("event_id", "recipient_id", "bank_account_number_confirmation", bank_details.fetch("bank_account_number"))
    expect(employment.reload.employee_record.private_details.fetch("bank_account_number")).to eq("000123456789")

    expect do
      update_bank({ bank_account_number: "000123456789", emergency_contact_name: "Synthetic contact" })
      expect(response).to have_http_status(:ok)
    end.not_to change { notices.count }
  end

  it "creates no notice for rejected confirmation and still notifies for a routing-only change" do
    expect do
      update_bank({ bank_account_number: "000123456789" }, bank_account_number_confirmation: "000123456788")
      expect(response).to have_http_status(:unprocessable_content)
    end.not_to change { notices.count }
    expect(employment.reload.employee_record.private_details).to eq(bank_details)

    expect do
      update_bank({ bank_ifsc: "SYNT0000002" })
      expect(response).to have_http_status(:ok)
    end.to change { notices.count }.by(2)
  end

  it "preserves ordinary profile editing without queuing payroll notices when payroll is disabled" do
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(nil)
    expect do
      update_bank({ bank_name: "Synthetic replacement bank" })
      expect(response).to have_http_status(:ok)
    end.not_to change { notices.count }
    expect(employment.reload.employee_record.private_details.fetch("bank_name")).to eq("Synthetic replacement bank")
  end
end
