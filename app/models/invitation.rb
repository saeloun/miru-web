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
#  role            :integer          default(0), not null
#  token           :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  company_id      :bigint           not null
#  sender_id       :bigint           not null
#
# Indexes
#
#  index_invitations_on_company_id  (company_id)
#  index_invitations_on_sender_id   (sender_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (sender_id => users.id)
#
class Invitation < ApplicationRecord
  enum role: [:owner, :admin, :employee, :book_keeper]

  # Associations
  belongs_to :company
  belongs_to :sender, class_name: "User"

  # Validations
  validates :recipient_email, :role, :token, presence: true
  validates_uniqueness_of :token
end
