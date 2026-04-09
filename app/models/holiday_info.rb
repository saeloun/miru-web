# frozen_string_literal: true

class HolidayInfo < ApplicationRecord
  include Discardable

  belongs_to :holiday

  has_many :timeoff_entries, dependent: :destroy

  enum :category, { national: 0, optional: 1 }

  validates :name, presence: true,
    format: { with: /\A[a-zA-Z\s\-']+\z/, message: "can only contain letters, spaces, hyphens, and apostrophes" },
    length: { maximum: 30 }
  validates :date, :category, presence: true
  validate :validate_holiday_category
  validate :validate_year

  after_discard :discard_timeoff_entries

  scope :for_year_and_category, ->(year, category) {
    joins(:holiday)
      .where(holidays: { year: })
      .where(category:)
  }

  private

    def validate_holiday_category
      unless holiday&.holiday_types&.include?(category)
        errors.add(:category, "must be a valid holiday category for the associated holiday")
      end
    end

    def validate_year
      if holiday && date&.year != holiday.year
        errors.add(:date, "must have the same year as the associated holiday")
      end
    end

    def discard_timeoff_entries
      timeoff_entries.discard_all
    end
end
