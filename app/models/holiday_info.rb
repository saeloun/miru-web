# frozen_string_literal: true

# == Schema Information
#
# Table name: holiday_infos
#
#  id         :bigint           not null, primary key
#  category   :string           not null
#  date       :date             not null
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  holiday_id :bigint           not null
#
# Indexes
#
#  index_holiday_infos_on_holiday_id  (holiday_id)
#
# Foreign Keys
#
#  fk_rails_...  (holiday_id => holidays.id)
#
class HolidayInfo < ApplicationRecord
  belongs_to :holiday

  enum category: { national: "national", optional: "optional" }
  validates :name, :date, :category, presence: true
  validate :validate_holiday_type

  scope :for_year_and_category, ->(year, category) {
    joins(:holiday)
      .where(holidays: { year: })
      .where(category:)
  }

  private

    def validate_holiday_category
      unless holiday&.holiday_types.include?(category)
        errors.add(:category, "must be a valid holiday category for the associated holiday")
      end
    end
end
