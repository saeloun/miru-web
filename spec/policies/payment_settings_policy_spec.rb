# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentSettingsPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  let(:another_company) { create(:company) }
  let(:another_admin) { create(:user, current_workspace_id: another_company.id) }
  let(:another_owner) { create(:user, current_workspace_id: another_company.id) }
  let(:another_employee) { create(:user, current_workspace_id: another_company.id) }

  subject { described_class }

  before do
    admin.add_role :admin, company
    owner.add_role :owner, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company

    another_admin.add_role :admin, another_company
    another_owner.add_role :owner, another_company
    another_employee.add_role :employee, another_company
  end

  shared_examples "grants access to admin and owner" do |action|
    it "allows admin and owner to perform #{action}" do
      expect(subject).to permit(admin, company)
      expect(subject).to permit(owner, company)
    end
  end

  shared_examples "denies access to employee and book keeper" do |action|
    it "denies #{action} to employee and book keeper" do
      expect(subject).not_to permit(employee, company)
      expect(subject).not_to permit(book_keeper, company)
    end
  end

  shared_examples "denies access to another company's users" do |action|
    it "denies #{action} to users from another company" do
      expect(subject).not_to permit(another_admin, company)
      expect(subject).not_to permit(another_owner, company)
      expect(subject).not_to permit(another_employee, company)
    end
  end

  permissions :index? do
    include_examples "grants access to admin and owner", "index"
    include_examples "denies access to employee and book keeper", "index"
    include_examples "denies access to another company's users", "index"
  end

  permissions :update_bank_account? do
    include_examples "grants access to admin and owner", "update_bank_account"
    include_examples "denies access to employee and book keeper", "update_bank_account"
    include_examples "denies access to another company's users", "update_bank_account"
  end

  permissions :destroy? do
    include_examples "grants access to admin and owner", "destroy"
    include_examples "denies access to employee and book keeper", "destroy"
    include_examples "denies access to another company's users", "destroy"
  end

  permissions :connect_stripe? do
    include_examples "grants access to admin and owner", "connect_stripe"
    include_examples "denies access to employee and book keeper", "connect_stripe"
    include_examples "denies access to another company's users", "connect_stripe"
  end
end
