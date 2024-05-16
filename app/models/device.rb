# frozen_string_literal: true

# == Schema Information
#
# Table name: devices
#
#  id                    :bigint           not null, primary key
#  device_type           :string           default("laptop")
#  insurance_bought_date :date
#  insurance_expiry_date :date
#  is_insured            :boolean          default(FALSE)
#  name                  :string
#  serial_number         :string
#  specifications        :jsonb
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  company_id            :bigint           not null
#  user_id               :bigint           not null
#
# Indexes
#
#  index_devices_on_company_id   (company_id)
#  index_devices_on_device_type  (device_type)
#  index_devices_on_user_id      (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
class Device < ApplicationRecord
  # Associations
  belongs_to :issued_by, class_name: "Company", foreign_key: "company_id"
  belongs_to :issued_to, class_name: "User", foreign_key: "user_id"

  # Device type values
  enum device_type: { laptop: "laptop", mobile: "mobile" }

  # Specifications values
  store_accessor :specifications, :processor, :ram, :graphics

  # Validations
  after_initialize :set_default_specifications, if: :new_record?
  validates :name, length: { maximum: 100 }
  validates :insurance_bought_date, presence: true, if: :is_insured?
  validates :insurance_expiry_date, presence: true, if: :is_insured?
  validates :insurance_expiry_date, comparison: { greater_than_or_equal_to: :insurance_bought_date }, if: :is_insured?

  private

    def set_default_specifications
      self.specifications = {
        "processor": "",
        "ram": "",
        "graphics": ""
      }
    end

    def is_insured?
      is_insured
    end
end
