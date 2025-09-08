# frozen_string_literal: true

# == Schema Information
#
# Table name: addresses
#
#  id               :bigint           not null, primary key
#  address_line_1   :string           not null
#  address_line_2   :string
#  address_type     :string           default("current")
#  addressable_type :string
#  city             :string           not null
#  country          :string           not null
#  pin              :string           not null
#  state            :string           not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  addressable_id   :bigint
#
# Indexes
#
#  index_addresses_on_addressable                   (addressable_type,addressable_id)
#  index_addresses_on_addressable_and_address_type  (addressable_type,addressable_id,address_type) UNIQUE
#
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
