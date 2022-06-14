# frozen_string_literal: true

# == Schema Information
#
# Table name: candidates
#
#  id             :bigint           not null, primary key
#  discarded_at   :datetime
#  email          :string
#  first_name     :string
#  last_name      :string
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  consultancy_id :bigint
#
# Indexes
#
#  index_candidates_on_consultancy_id  (consultancy_id)
#  index_candidates_on_discarded_at    (discarded_at)
#
class Candidate < ApplicationRecord
  include Discard::Model

  belongs_to :consultancy, optional: true

  # Validations
  validates :first_name, presence: true

  validates :email, uniqueness: true, format: { with: Devise.email_regexp }

  def candidate_detail
    {
      id:, first_name:, email:, last_name:, consultancy_id:
    }
  end
end
