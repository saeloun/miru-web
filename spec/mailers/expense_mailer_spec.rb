# frozen_string_literal: true

require "rails_helper"

RSpec.describe ExpenseMailer, type: :mailer do
  describe "submitted" do
    let(:company) { create(:company) }
    let(:employee) { create(:user, current_workspace_id: company.id, first_name: "Ava", last_name: "Jones") }
    let(:reviewer) { create(:user, current_workspace_id: company.id) }
    let(:expense) { create(:expense, company:, category_name: "Travel", user: employee, description: "Taxi reimbursement") }
    let(:mail) { ExpenseMailer.with(expense_id: expense.id, recipients: [reviewer.email]).submitted }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      create(:employment, company:, user: reviewer)
      reviewer.add_role :admin, company
    end

    it "renders the headers" do
      expect(mail.subject).to eq("Ava Jones submitted a reimbursement request")
      expect(mail.to).to eq([reviewer.email])
    end

    it "renders the body" do
      expect(mail.body.encoded).to include("Taxi reimbursement")
      expect(mail.body.encoded).to include("Open expense")
    end
  end

  describe "paid" do
    let(:company) { create(:company) }
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let(:expense) { create(:expense, company:, category_name: "Travel", user: employee, description: "Flight reimbursement") }
    let(:mail) { ExpenseMailer.with(expense_id: expense.id, recipients: [employee.email]).paid }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
    end

    it "renders the headers" do
      expect(mail.subject).to eq("Your reimbursement has been marked as paid")
      expect(mail.to).to eq([employee.email])
    end

    it "renders the body" do
      expect(mail.body.encoded).to include("marked as paid")
      expect(mail.body.encoded).to include("Flight reimbursement")
    end
  end

  describe "approved" do
    let(:company) { create(:company) }
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let(:expense) { create(:expense, company:, category_name: "Travel", user: employee, description: "Hotel reimbursement") }
    let(:mail) { ExpenseMailer.with(expense_id: expense.id, recipients: [employee.email]).approved }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
    end

    it "renders the headers" do
      expect(mail.subject).to eq("Your reimbursement has been approved")
      expect(mail.to).to eq([employee.email])
    end

    it "renders the body" do
      expect(mail.body.encoded).to include("approved")
      expect(mail.body.encoded).to include("Hotel reimbursement")
    end
  end

  describe "rejected" do
    let(:company) { create(:company) }
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let(:expense) { create(:expense, company:, category_name: "Travel", user: employee, description: "Meal reimbursement") }
    let(:mail) { ExpenseMailer.with(expense_id: expense.id, recipients: [employee.email]).rejected }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
    end

    it "renders the headers" do
      expect(mail.subject).to eq("Your reimbursement needs updates before approval")
      expect(mail.to).to eq([employee.email])
    end

    it "renders the body" do
      expect(mail.body.encoded).to include("needs updates")
      expect(mail.body.encoded).to include("Meal reimbursement")
    end
  end
end
