# frozen_string_literal: true

# == Schema Information
#
# Table name: ses_invalid_emails (legacy name, stores all invalid emails)
#
#  id         :bigint           not null, primary key
#  bounce     :boolean          default(FALSE)
#  compliant  :boolean          default(FALSE)
#  email      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class InvalidEmail < ApplicationRecord
  self.table_name = "ses_invalid_emails" # Keep using existing table
  
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  
  before_save :downcase_email
  
  scope :bounced, -> { where(bounce: true) }
  scope :spam_complaints, -> { where(compliant: true) }
  
  # Check if an email should be excluded from sends
  def self.invalid?(email)
    exists?(email: email.downcase)
  end
  
  # Get all invalid emails for exclusion
  def self.invalid_emails
    pluck(:email)
  end
  
  private
  
    def downcase_email
      self.email = email.downcase if email.present?
    end
end