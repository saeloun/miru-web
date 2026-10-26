# frozen_string_literal: true

class HiringRole < ApplicationRecord
  belongs_to :company
  has_many :hiring_applications, dependent: :restrict_with_exception
  audited associated_with: :company, only: [:status]

  normalizes :title, with: ->(value) { value.strip }
  validates :title, presence: true, length: { maximum: 200 }, format: { without: /[[:cntrl:]]/ }
  validates :status, inclusion: { in: %w[open closed] }
end
