# frozen_string_literal: true

# == Schema Information
#
# Table name: invitations
#
#  id              :bigint           not null, primary key
#  accepted_at     :datetime
#  expired_at      :datetime
#  first_name      :string
#  last_name       :string
#  recipient_email :string           not null
#  role            :integer          default("owner"), not null
#  token           :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  company_id      :bigint           not null
#  sender_id       :bigint           not null
#
# Indexes
#
#  index_invitations_on_company_id                      (company_id)
#  index_invitations_on_company_id_and_recipient_email  (company_id,recipient_email) UNIQUE
#  index_invitations_on_sender_id                       (sender_id)
#  index_invitations_on_token                           (token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (sender_id => users.id)
#
class Invitation < ApplicationRecord
  enum role: [:owner, :admin, :employee, :book_keeper]

  # Constant
  MAX_EXPIRATION_DAY = 14.days

  # Associations
  belongs_to :company
  belongs_to :sender, class_name: "User"

  # Validations
  validates :recipient_email, :role, :token, :expired_at, presence: true
  validates :recipient_email, format: { with: Devise.email_regexp }
  validates_uniqueness_of :token
  validates_uniqueness_of :recipient_email, scope: :company_id
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 50 }

  # Scopes
  scope :valid_invitations, -> {
  where(accepted_at: nil, expired_at: Time.current...(Time.current + MAX_EXPIRATION_DAY))
}
  scope :sender_invitations, -> (sender) { where(sender:).valid_invitations }
  scope :company_invitations, -> (company) { where(company:).valid_invitations }

  # Callbacks
  before_validation :set_token, on: :create
  before_validation :set_expired_at, on: :create
  after_create :send_invitation_mail

  def full_name
    "#{first_name} #{last_name}"
  end

  def is_valid?
    (expired_at >= Time.current) && accepted_at.nil?
  end

  private

    def set_token
      loop do
        self.token = Devise.friendly_token
        break unless Invitation.exists?(token: self.token)
      end
    end

    def set_expired_at
      self.expired_at = Time.current + MAX_EXPIRATION_DAY
    end

    def send_invitation_mail
      user_already_exists = User.exists?(email: recipient_email)
      UserInvitationMailer.with(
        recipient: recipient_email,
        token:,
        user_already_exists:,
        name: full_name
      ).send_user_invitation.deliver_later
    end
end
