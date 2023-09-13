# frozen_string_literal: true

# == Schema Information
#
# Table name: holidays
#
#  id                              :bigint           not null, primary key
#  enable_optional_holidays        :boolean          default(FALSE)
#  holiday_types                   :string           default([]), is an Array
#  no_of_allowed_optional_holidays :integer
#  time_period_optional_holidays   :integer          default(NULL), not null
#  year                            :integer          not null
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#  company_id                      :bigint           not null
#
# Indexes
#
#  index_holidays_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class Holiday < ApplicationRecord
  has_many :holiday_infos, dependent: :destroy
  belongs_to :company

  enum time_period_optional_holidays: { per_quarter: 0, per_year: 1, per_month: 2 }

  validates :year, presence: true
  validate :unique_holiday_record_per_year

  private

    def unique_holiday_record_per_year
      existing_record = company.holidays.where(year:).where.not(id:).exists?

      if existing_record
        errors.add(:year, "already has a holiday record for this company")
      end
    end
end
