# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  calendar_connected     :boolean          default(TRUE)
#  calendar_enabled       :boolean          default(TRUE)
#  confirmation_sent_at   :datetime
#  confirmation_token     :string
#  confirmed_at           :datetime
#  current_sign_in_at     :datetime
#  current_sign_in_ip     :string
#  date_of_birth          :date
#  discarded_at           :datetime
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  first_name             :string           not null
#  last_name              :string           not null
#  last_sign_in_at        :datetime
#  last_sign_in_ip        :string
#  phone                  :string
#  provider               :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  social_accounts        :jsonb
#  token                  :string(50)
#  uid                    :string
#  unconfirmed_email      :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  current_workspace_id   :bigint
#  personal_email_id      :string
#
# Indexes
#
#  index_users_on_confirmation_token    (confirmation_token)
#  index_users_on_current_workspace_id  (current_workspace_id)
#  index_users_on_discarded_at          (discarded_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_email_trgm            (email) USING gin
#  index_users_on_first_name_trgm       (first_name) USING gin
#  index_users_on_last_name_trgm        (last_name) USING gin
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (current_workspace_id => companies.id)
#
require "rails_helper"

RSpec.describe User, type: :model do
  let(:company) { create(:company) }
  let(:company_2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
  end

  describe "Associations" do
    it { is_expected.to have_many(:companies).through(:employments) }
    it { is_expected.to have_many(:employments).dependent(:destroy) }
    it { is_expected.to have_many(:identities).dependent(:delete_all) }
    it { is_expected.to have_many(:project_members).dependent(:destroy) }
    it { is_expected.to have_many(:timesheet_entries) }
    it { is_expected.to have_many(:previous_employments).dependent(:destroy) }
    it { is_expected.to have_many(:addresses).dependent(:destroy) }
    it { is_expected.to have_one_attached(:avatar) }
    it { is_expected.to have_many(:devices).dependent(:destroy) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:first_name) }
    it { is_expected.to validate_presence_of(:last_name) }
    it { is_expected.to allow_value("foo").for(:first_name) }
    it { is_expected.not_to allow_value("foo&23423").for(:first_name) }
    it { is_expected.to allow_value("foo").for(:last_name) }
    it { is_expected.not_to allow_value("foo&23423").for(:last_name) }
    it { is_expected.to validate_length_of(:first_name).is_at_most(20) }
    it { is_expected.to validate_length_of(:last_name).is_at_most(20) }
  end

  describe "Callbacks" do
    it { is_expected.to callback(:discard_project_members).after(:discard) }
  end

  describe "Scopes" do
    let(:company) { create(:company) }
    let!(:valid_invitation1) { create(:invitation, sender: user) }
    let!(:valid_invitation2) { create(:invitation) }
    let!(:invalid_invitations) { create_list(:invitation, 2) }
    let!(:invalid_invitations_with_sender) { create_list(:invitation, 2, sender: user) }

    before do
      invalid_invitations.concat(invalid_invitations_with_sender).each do |invalid_invitation|
        invalid_invitation.update_columns(expired_at: Time.current - 1.day)
      end
    end

    describe ".valid_invitations" do
      it "returns all valid invitations" do
        expect(user.invitations.valid_invitations.size).to eq(1)
        expect(user.invitations.valid_invitations).to match_array(valid_invitation1)
        expect(user.invitations.valid_invitations).not_to match_array(valid_invitation2)
      end
    end
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
      expect(user.primary_role(company)).to eq("admin")
      expect(user.primary_role(company)).not_to eq("owner")
    end

    it "returns employee as default role" do
      expect(user.primary_role(company)).to eq("employee")
      expect(user.primary_role(company)).not_to eq("admin")
      expect(user.primary_role(company)).not_to eq("owner")
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

  describe "#assign_company_and_role" do
    before do
      user.remove_role :admin, company
      user.employments.destroy_all
    end

    it "user will be added as a company member with employee role" do
      user.current_company = company
      user.role = "employee"
      user.assign_company_and_role
      expect(company.employments.pluck(:user_id).include?(user.id)).to be_truthy
    end

    it "when role is nil user won't be added as a company member with employee role" do
      user.current_company = company
      user.role = nil
      user.assign_company_and_role
      expect(user.errors.messages.size).to eq(1)
      expect(user.errors.full_messages).to include("Something went wrong")
    end
  end

  describe "#remove_roles_for" do
    before do
      user.add_role :admin, company
      user.add_role :owner, company
      user.add_role :employee, company_2
    end

    it "removes all roles of user from only from the given company" do
      user.remove_roles_for(company)
      expect(user.roles.where(resource: company)).to eq([])
      expect(user.roles.where(resource: company_2).first.name).to eq("employee")
    end
  end
end
