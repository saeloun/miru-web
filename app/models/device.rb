# frozen_string_literal: true

class Device < ApplicationRecord
  # Associations
  belongs_to :issued_by, class_name: "Company", foreign_key: "company_id"
  belongs_to :issued_to, class_name: "User", foreign_key: "user_id"

  # Device type values
  enum :device_type, { laptop: "laptop", mobile: "mobile" }

  # Specifications values
  store_accessor :specifications, :processor, :ram, :graphics

  # Validations
  after_initialize :set_default_specifications, if: :new_record?
  validates :device_type, :name, :serial_number, presence: true
  validates :name, length: { maximum: 100 }

  private

    def set_default_specifications
      self.specifications = {
        "processor": "",
        "ram": "",
        "graphics": ""
      }
    end
end
