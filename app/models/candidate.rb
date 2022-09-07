# frozen_string_literal: true

# == Schema Information
#
# Table name: candidates
#
#  id                            :bigint           not null, primary key
#  address                       :text
#  country                       :string
#  cover_letter                  :text
#  description                   :string
#  discarded_at                  :datetime
#  email                         :string
#  emails                        :text             default([]), is an Array
#  first_name                    :string
#  initial_communication         :integer
#  last_name                     :string
#  linkedinid                    :string
#  mobilephone                   :string
#  preferred_contact_method_code :integer
#  skypeid                       :string
#  source_code                   :integer
#  state_code                    :integer
#  status_code                   :integer
#  tech_stack_ids                :text             default([]), is an Array
#  telephone                     :string
#  title                         :string
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  assignee_id                   :bigint
#  company_id                    :bigint
#  consultancy_id                :bigint
#  created_by_id                 :bigint
#  reporter_id                   :bigint
#  updated_by_id                 :bigint
#
# Indexes
#
#  index_candidates_on_assignee_id     (assignee_id)
#  index_candidates_on_company_id      (company_id)
#  index_candidates_on_consultancy_id  (consultancy_id)
#  index_candidates_on_created_by_id   (created_by_id)
#  index_candidates_on_discarded_at    (discarded_at)
#  index_candidates_on_reporter_id     (reporter_id)
#  index_candidates_on_updated_by_id   (updated_by_id)
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
