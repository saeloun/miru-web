# frozen_string_literal: true

class TruncateAddressData < ActiveRecord::Migration[7.0]
  def change
    Address.find_each do |address|
      address.update(
        address_line_1: address.address_line_1&.slice(0, 50),
        address_line_2: address.address_line_2&.slice(0, 50),
        pin: address.pin&.slice(0, 10)
      )
    end
  end
end
