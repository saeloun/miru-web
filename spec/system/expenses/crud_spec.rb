# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Expenses CRUD", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "company date formats" do
    { "DD-MM-YYYY" => %w[19-10-2026 01-10-2026],
      "MM-DD-YYYY" => %w[10-19-2026 10-01-2026],
      "YYYY-MM-DD" => %w[2026-10-19 2026-10-01],
      nil => %w[10-19-2026 10-01-2026], "" => %w[10-19-2026 10-01-2026] }.each do |format, displayed_dates|
      context "with #{format.inspect}" do
        let(:company) { create(:company, date_format: format) }

        %w[2026-10-19 2026-10-01].zip(displayed_dates).each do |date, displayed_date|
          it "preserves #{date} and approval after a description-only edit" do
            expense = create(:expense, company:, user:, date:, category_name: "Travel",
              description: "Synthetic dated reimbursement")
            expense.approve!

            with_forgery_protection do
              visit "/expenses"
              find("button[aria-label='Expense actions for Synthetic dated reimbursement']", wait: 10).click
              find("[role='menuitem']", text: "Edit expense").click
              within("[role='dialog']") do
                expect(page).to have_field("Date", with: displayed_date)
                fill_in "Description", with: "Synthetic corrected description"
                click_button "Save Changes"
              end
              expect(page).to have_content("Synthetic corrected description")
              expect(expense.reload.date).to eq(Date.iso8601(date))
              expect(expense).to be_approved
            end
          end
        end
      end
    end
  end

  describe "exact monetary values" do
    let(:company) { create(:company, base_currency: "INR") }

    it "preserves the amount when only an expense description changes" do
      expense = create(:expense, company:, user:, currency: "INR", amount: "900719925474099.99",
        category_name: "Travel", expense_type: :business, description: "Synthetic exact expense", date: Date.current)

      with_forgery_protection do
        visit "/expenses"
        row = find("tbody tr", text: "Synthetic exact expense")
        expect(row.all("td").map { |cell| cell.text.gsub(/[^\d.]/, "") }).to include("900719925474099.99")
        ["Total Expenses", "Business"].each do |title|
          card = find("h3", text: "#{title} (INR)", exact_text: true).find(:xpath, "../..")
          expect(card.find("div.text-2xl").text.gsub(/[^\d.]/, "")).to eq("900719925474099.99")
        end
        find("button[aria-label='Expense actions for Synthetic exact expense']", wait: 10).click
        find("[role='menuitem']", text: "Edit expense").click
        within("[role='dialog']") do
          expect(page).to have_field("Amount", with: "900719925474099.99")
          fill_in "Description", with: "Synthetic description correction"
          click_button "Save Changes"
        end
        expect(page).to have_content("Synthetic description correction")
        expect(expense.reload.amount).to eq(BigDecimal("900719925474099.99"))
      end
    end

    it "sorts fractional amounts and large adjacent cents numerically in both directions" do
      amounts = %w[9.11 9.90 10.00 900719925474099.98 900719925474099.99]
      amounts.reverse_each do |amount|
        create(:expense, company:, user:, currency: "INR", amount:,
          description: "Synthetic amount #{amount}", date: Date.current)
      end

      with_forgery_protection do
        visit "/expenses"
        click_button "Amount", exact: true
        descriptions = -> { page.all("tbody tr").map { |row| row.find("td", text: "Synthetic amount").text } }
        expect(descriptions.call).to eq(amounts.map { |amount| "Synthetic amount #{amount}" })
        click_button "Amount", exact: true
        expect(descriptions.call).to eq(amounts.reverse.map { |amount| "Synthetic amount #{amount}" })
      end
    end
  end

  describe "expense list and detail" do
    let!(:business_expense) do
      create(:expense,
        company:,
        category_name: "Travel",
        vendor_name: "Acme Supplies",
        amount: 250.00,
        expense_type: :business,
        description: "Conference registration fee",
        date: Date.current)
    end

    let!(:personal_expense) do
      create(:expense,
        company:,
        category_name: "Software",
        vendor_name: "App Store",
        amount: 9.99,
        expense_type: :personal,
        description: "Personal app subscription",
        date: 3.days.ago)
    end

    it "shows expenses on the list with the create action" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Add Expense", wait: 10)
        expect(page).to have_content("Conference registration fee", wait: 10)
        expect(page).to have_content("Personal app subscription", wait: 10)
      end
    end

    it "shows the important fields on the expense detail page" do
      with_forgery_protection do
        visit "/expenses/#{business_expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Travel", wait: 10)
        expect(page).to have_content("Acme Supplies", wait: 10)
        expect(page).to have_content("business", wait: 10)
        expect(page).to have_content("Conference registration fee", wait: 10)
        expect(page).to have_content("250", wait: 10)
        expect(page).to have_content("Edit", wait: 10)
        expect(page).to have_content("Delete", wait: 10)
      end
    end

    it "handles a personal expense detail view" do
      with_forgery_protection do
        visit "/expenses/#{personal_expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("personal", wait: 10)
        expect(page).to have_content("9.99", wait: 10)
        expect(page).to have_content("Personal app subscription", wait: 10)
      end
    end
  end

  describe "deleting an expense" do
    let!(:expense) do
      create(:expense,
        company:,
        category_name: "Travel",
        vendor_name: "Acme Supplies",
        amount: 75.50,
        expense_type: :business,
        description: "Taxi fare",
        date: Date.current)
    end

    it "confirms and deletes the expense" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        click_on "Delete"

        expect(page).to have_content("Delete Expense", wait: 10)
        expect(page).to have_content("Are you sure you want to delete this expense?", wait: 10)

        click_on "DELETE"

        expect(page).to have_current_path("/expenses", wait: 10)
        expect(page).not_to have_content("Taxi fare", wait: 10)
      end
    end
  end

  context "when employee views expenses" do
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let!(:employee_expense) do
      create(:expense,
        company:,
        user: employee,
        category_name: "Travel",
        vendor_name: "Acme Supplies",
        amount: 42.50,
        expense_type: :business,
        description: "Mileage reimbursement",
        date: Date.current)
    end

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      sign_in(employee)
    end

    it "shows the employee their own submitted expenses" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_current_path("/expenses", wait: 10)
        expect(page).to have_content("Mileage reimbursement", wait: 10)
        expect(page).to have_content("Add Expense", wait: 10)
      end
    end
  end

  describe "employee reimbursement submission with receipts" do
    let(:admin) { create(:user, current_workspace_id: company.id) }
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: admin)
      admin.add_role :admin, company
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
    end

    it "allows an employee to submit multiple receipts and an admin to preview, approve, and mark it paid" do
      with_forgery_protection do
        sign_in(employee)
        visit "/expenses"

        find_all("button", text: "Add Expense").last.click
        fill_in "Description", with: "Client dinner reimbursement"
        fill_in "Amount", with: "48.50"
        find("button[role='combobox']", text: "Select category", wait: 10).click
        find("[role='option']", text: "Travel", wait: 10).click
        fill_in "Vendor", with: "Cafe 21"
        attach_file "Receipts", Rails.root.join("spec/support/fixtures/test-image.png"), make_visible: true
        attach_file "Receipts", Rails.root.join("spec/support/fixtures/test-image.png"), make_visible: true
        within("[role='dialog']") do
          expect(page).to have_button("Remove", count: 2)
          find_all("button", text: "Remove").first.click
          expect(page).to have_button("Remove", count: 1)
        end
        attach_file "Receipts", Rails.root.join("spec/support/fixtures/test-signature.png"), make_visible: true
        within("[role='dialog']") do
          click_on "Add Expense"
        end

        expect(page).to have_content("Client dinner reimbursement", wait: 10)
        expect(Expense.last.receipts.count).to eq(2)

        sign_in(admin)
        visit "/expenses"

        expect(page).to have_content("Client dinner reimbursement", wait: 10)
        expect(page).to have_content("Submitted", wait: 10)
        find("button[aria-label='View receipts for Client dinner reimbursement']", wait: 10).click
        expect(page).to have_content("Receipt preview", wait: 10)
        expect(page).to have_css("[role='dialog'] img", wait: 10)
        page.find("body").send_keys(:escape)
        find("button[aria-label='Expense actions for Client dinner reimbursement']", wait: 10).click
        find("[role='menuitem']", text: "Approve expense", wait: 10).click
        expect(page).to have_content("Approved", wait: 10)
        find("button[aria-label='Expense actions for Client dinner reimbursement']", wait: 10).click
        find("[role='menuitem']", text: "Mark as paid", wait: 10).click
        expect(page).to have_content("Paid", wait: 10)
      end
    end
  end

  describe "adding attachments from expense details" do
    let!(:expense) do
      create(:expense, company:, user:, category_name: "Travel", amount: 25, date: Date.current).tap do |expense|
        expense.receipts.attach(
          io: File.open(Rails.root.join("spec/support/fixtures/test-image.png")),
          filename: "original.png", content_type: "image/png")
      end
    end

    [1400, 390].each do |width|
      it "keeps the upload available for additional batches at #{width}px" do
        page.current_window.resize_to(width, 1000)
        with_forgery_protection do
          visit "/expenses/#{expense.id}"
          click_on "Edit"
          attach_file "expense-receipts", [
            Rails.root.join("spec/support/fixtures/test-image.png"),
            Rails.root.join("spec/support/fixtures/test-signature.png")
          ], make_visible: true
          expect(page).to have_content("Add attachments")
          attach_file "expense-receipts", Rails.root.join("spec/support/fixtures/test-image.png"), make_visible: true
          expect(page).to have_button("Remove test-image.png", count: 2)
          expect(page).to have_button("Remove test-signature.png")
          click_on "Save Changes"

          expect(page).to have_content("4 attached", wait: 10)
          expect(expense.reload.receipts.count).to eq(4)
        end
      ensure
        page.current_window.resize_to(1400, 1000)
      end
    end
  end

  it "reports attachment limits without dropping selected receipts" do
    with_forgery_protection do
      visit "/expenses/new"
      fill_in "Description", with: "Attachment validation"
      attach_file "Receipts", Rails.root.join("spec/support/fixtures/test-image.png")

      Dir.mktmpdir do |directory|
        oversized_receipt = File.join(directory, "oversized.png")
        File.write(oversized_receipt, "")
        File.truncate(oversized_receipt, 10.megabytes + 1)
        attach_file "Receipts", oversized_receipt
        expect(page).to have_content("Each attachment must be 10 MB or smaller.")

        receipts = 10.times.map do |index|
          File.join(directory, "receipt-#{index}.png").tap do |path|
            FileUtils.cp(Rails.root.join("spec/support/fixtures/test-image.png"), path)
          end
        end
        attach_file "Receipts", receipts
        expect(page).to have_content("You can attach up to 10 files per expense")
        within("[role='dialog']") do
          expect(page).to have_button("Remove", count: 1)
          expect(page).to have_content("test-image.png")
        end
      end
    end
  end
end
