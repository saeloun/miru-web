# frozen_string_literal: true

# == Schema Information
#
# Table name: invitations
#
#  id               :bigint           not null, primary key
#  accepted_at      :datetime
#  expired_at       :datetime
#  first_name       :string
#  last_name        :string
#  recipient_email  :string           not null
#  role             :integer          default("owner"), not null
#  token            :string           not null
#  virtual_verified :boolean          default(FALSE)
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  client_id        :bigint
#  company_id       :bigint           not null
#  sender_id        :bigint           not null
#
# Indexes
#
#  index_invitations_on_accepted_at           (accepted_at)
#  index_invitations_on_client_id             (client_id)
#  index_invitations_on_company_id            (company_id)
#  index_invitations_on_expired_at            (expired_at)
#  index_invitations_on_first_name_trgm       (first_name) USING gin
#  index_invitations_on_last_name_trgm        (last_name) USING gin
#  index_invitations_on_recipient_email       (recipient_email)
#  index_invitations_on_recipient_email_trgm  (recipient_email) USING gin
#  index_invitations_on_role                  (role)
#  index_invitations_on_sender_id             (sender_id)
#  index_invitations_on_token                 (token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (sender_id => users.id)
#
require "rails_helper"

RSpec.describe Invitation, type: :model do
  let(:company) { create(:company) }
  let(:invitation) { create(:invitation, company:) }

  subject { create(:invitation) }

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:sender) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:recipient_email) }
    it { is_expected.to validate_presence_of(:role) }
    it { is_expected.to validate_presence_of(:token) }
    it { is_expected.to allow_value(Faker::Lorem.characters(number: 10)).for(:token) }
    it { is_expected.to validate_length_of(:first_name).is_at_most(20) }
    it { is_expected.to validate_length_of(:last_name).is_at_most(20) }
    it { is_expected.not_to allow_value(invitation.token).for(:token) }
    it { is_expected.to validate_uniqueness_of(:recipient_email).on(:create) }
    it { is_expected.not_to allow_value("test").for(:recipient_email) }
    it { is_expected.not_to allow_value("test@example.com").for(:recipient_email) }
    it { is_expected.to allow_value("foo").for(:first_name) }
    it { is_expected.not_to allow_value("foo&23423").for(:first_name) }
    it { is_expected.to allow_value("foo").for(:last_name) }
    it { is_expected.not_to allow_value("foo&23423").for(:last_name) }
  end

  describe "Scopes" do
    let(:company) { create(:company) }
    let!(:valid_invitations) { create_list(:invitation, 2, company:) }
    let!(:invalid_invitations) { create_list(:invitation, 2, company:) }

    before do
      create_list(:invitation, 2, accepted_at: Time.current - 1.day, company:)
      invalid_invitations.each do |invalid_invitation|
        invalid_invitation.update_columns(expired_at: Time.current - 1.day)
      end
    end

    describe ".valid_invitations" do
      it "returns all valid invitations" do
        expect(company.invitations.valid_invitations.size).to eq(2)
        expect(company.invitations.valid_invitations).to match_array(valid_invitations)
      end
    end
  end

  describe "Callbacks" do
    it { is_expected.to callback(:set_token).before(:validation) }
    it { is_expected.to callback(:set_expired_at).before(:validation) }
    it { is_expected.to callback(:send_invitation_mail).after(:commit) }
  end

  describe "#full_name" do
    it "returns invited users full name" do
      expect(subject.full_name).to eq("#{subject.first_name} #{subject.last_name}")
    end
  end

  describe "#is_valid?" do
    before do
      @invitation = create(:invitation, company:)
      @accepted_invitation = create(:invitation, company:, accepted_at: Time.current)
      @expired_invitation = create(:invitation, company:)
      @expired_invitation.update(expired_at: Time.current - 1.day)
    end

    it "returns true if invitation is valid" do
      expect(@invitation.is_valid?).to eq(true)
    end

    it "returns false if invitation is already accepted" do
      expect(@accepted_invitation.is_valid?).to eq(false)
    end

    it "returns false if invitation is already expired" do
      expect(@expired_invitation.is_valid?).to eq(false)
    end
  end

  describe "#user_invitation_present?" do
    it "returns true if user with recipient email is not present" do
      invitation = build(:invitation, company:, expired_at: nil)
      expect(invitation.user_invitation_present?).to be_falsey
    end

    it "returns false if user with recipient email is present" do
      existing_invitation = create(:invitation, company:)
      invitation = build(:invitation, company:, recipient_email: existing_invitation.recipient_email)
      expect(invitation.user_invitation_present?).to be_truthy
    end
  end

  describe "#set_token" do
    it "sets token while creating invitation" do
      invitation = build(:invitation, company:, token: nil)
      invitation.save
      expect(invitation.token).not_to be_nil
    end
  end

  describe "#set_expired_at" do
    it "sets expired_at while creating invitation" do
      invitation = build(:invitation, company:, expired_at: nil)
      invitation.save
      expect(invitation.expired_at).not_to be_nil
    end
  end



  describe "#recipient_email_not_changed" do
    it "raises error when invitation recipient_email is updated" do
      invitation = create(:invitation, company:)
      expect { invitation.update!(recipient_email: "test@example.com") }
        .to raise_error(ActiveRecord::RecordInvalid)
        .with_message("Validation failed: Recipient email updation is not allowed")
    end
  end
end
