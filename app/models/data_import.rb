# frozen_string_literal: true

class DataImport < ApplicationRecord
  MAX_ROW_ERRORS = 200
  SOURCES = %w[harvest].freeze
  KINDS = %w[time_entries].freeze
  STATUSES = %w[pending processing completed failed].freeze

  belongs_to :company
  belongs_to :user
  has_one_attached :file

  validates :source, inclusion: { in: SOURCES }
  validates :kind, inclusion: { in: KINDS }
  validates :status, inclusion: { in: STATUSES }

  before_validation { self.row_errors = Array(row_errors).first(MAX_ROW_ERRORS) }

  scope :recent, -> { order(created_at: :desc) }
end
