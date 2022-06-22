# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:company_user, company:, user:)
  end

  describe "Associations" do
    it { is_expected.to have_many(:companies).through(:company_users) }
    it { is_expected.to have_many(:company_users).dependent(:destroy) }
    it { is_expected.to have_many(:identities).dependent(:delete_all) }
    it { is_expected.to have_many(:project_members).dependent(:destroy) }
    it { is_expected.to have_many(:timesheet_entries) }
    it { is_expected.to have_many(:previous_employments).dependent(:destroy) }
    it { is_expected.to have_many(:addresses).dependent(:destroy) }
    it { is_expected.to have_one_attached(:avatar) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:first_name) }
    it { is_expected.to validate_presence_of(:last_name) }
    it { is_expected.to allow_value("foo").for(:first_name) }
    it { is_expected.not_to allow_value("foo&23423").for(:first_name) }
    it { is_expected.to allow_value("foo").for(:last_name) }
    it { is_expected.not_to allow_value("foo&23423").for(:last_name) }
    it { is_expected.to validate_length_of(:first_name).is_at_most(50) }
    it { is_expected.to validate_length_of(:last_name).is_at_most(50) }
  end

  describe "Callbacks" do
    it { is_expected.to callback(:discard_project_members).after(:discard) }
  end

  it "checks if it is an owner" do
    user.add_role :owner, company
    expect(user.has_role?(:owner, company)).to be_truthy
  end

  it "checks if it is an admin" do
    user.add_role :admin, company
    expect(user.has_role?(:admin, company)).to be_truthy
  end

  it "checks if it is an employee" do
    user.add_role :employee, company
    expect(user.has_role?(:employee, company)).to be_truthy
  end

  describe "#primary_role" do
    it "shows the first role name" do
      user.add_role :admin, company
      user.add_role :owner, company
      expect(user.primary_role).to eq("admin")
      expect(user.primary_role).not_to eq("owner")
    end

    it "returns employee as default role" do
      expect(user.primary_role).to eq("employee")
      expect(user.primary_role).not_to eq("admin")
      expect(user.primary_role).not_to eq("owner")
    end
  end

  describe "#full_name" do
    it "shows the full name of user" do
      user.first_name = "First"
      user.last_name = "Last"
      expect(user.full_name).to eq("First Last")
    end
  end

  describe "#active_for_authentication?" do
    context "when user is an admin/owner" do
      before { user.add_role :admin, company }

      it "returns true if user is not discarded" do
        expect(user.active_for_authentication?).to be_truthy
      end

      it "returns false if user is discarded" do
        user.discard!
        expect(user.active_for_authentication?).not_to be_truthy
      end
    end

    context "when user is not an admin/owner" do
      before { user.remove_role :admin, company }

      it "returns true if user is not discarded" do
        expect(user.active_for_authentication?).to be_truthy
      end

      it "returns false if user is discarded" do
        user.discard!
        expect(user.active_for_authentication?).not_to be_truthy
      end
    end
  end

  describe "Default social account on create" do
    it "checks for empty social account urls" do
      expect(user.social_accounts["github_url"]).to eq("")
      expect(user.social_accounts["linkedin_url"]).to eq("")
    end
  end
end
