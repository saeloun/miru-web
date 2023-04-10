# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Bulk Download Invoice", type: :system do
  # let!(:invoice) { create :invoice_with_invoice_line_items, status: :paid }
  # let(:client) { invoice.client }
  # let!(:company) { invoice.company }
  # let!(:invoice2) { create :invoice_with_invoice_line_items, status: :paid, client: }

  # let!(:invoice2) { create :invoice_with_invoice_line_items, status: :paid, client: }
  # let!(:invoices1) { create(:invoice, client:) }
  # let!(:invoice2) { create(:invoice, client:) }
  let!(:company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:invoice_1) { create(:invoice_with_invoice_line_items, status: :paid, client:) }
  let(:invoice_2) { create(:invoice_with_invoice_line_items, status: :paid, client:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  # let!(:invoices) { create_list(:invoice, 2, client:) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company
  end

  context "when logged-in user is Admin" do
    before do
      sign_in admin
    end

    it "can download single invoice" do
      with_forgery_protection do
        visit "/invoices"
        sleep 15
        p "_____"
        # p invoice1
        # p invoice2
        # find_by_id("#{invoice.id.to_s}", visible: false).click
        # click_button "Actions"
        # find_by_id("download").click

        # expect {
        #   BulkInvoiceDownloadJob.perform_later([6], nil, "abc", "")
        # }.to have_enqueued_job
      end
    end
  end

  # context "when logged-in user is Employee" do
  #   before do
  #     sign_in employee
  #   end

  #   it "is not able to see invoices option" do
  #     with_forgery_protection do
  #       visit "time-tracking"
  #       expect(page).to have_no_link("invoices")
  #     end
  #   end
  # end
end
