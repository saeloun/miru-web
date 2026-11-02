# frozen_string_literal: true

class CompensationVersion < ApplicationRecord
  belongs_to :employment
  serialize :salary_details, coder: JSON, type: Hash
  encrypts :salary_details
  validates :effective_on, presence: true
  attr_readonly :employment_id, :effective_on, :salary_details
end
