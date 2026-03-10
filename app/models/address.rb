# frozen_string_literal: true

class Address < ApplicationRecord
  # Associations
  belongs_to :addressable, polymorphic: true

  # Address type values
  enum :address_type, { current: "current", permanent: "permanent" }

  # Validations
  validates :address_type, :address_line_1, :state, :city, :country, :pin, presence: true
  validates :address_type, uniqueness: { scope: [ :addressable_id, :addressable_type ] }
  validates :address_line_1, :address_line_2, length: { maximum: 50 }
  validates :pin, length: { maximum: 10 }
  def formatted_address
    [address_line_1, address_line_2, city, state, pin, country].reject(&:blank?).join(", ")
  end
end
