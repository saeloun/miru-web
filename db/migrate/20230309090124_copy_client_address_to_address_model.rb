# frozen_string_literal: true

class CopyClientAddressToAddressModel < ActiveRecord::Migration[7.0]
  def change
    Client.find_each do |client|
      puts " * * * * * * * * * Client * * * * * * Id: #{client.id} * * * * * * Name: #{client.name}"
      address_record = client.current_address
      unless address_record.present?
        old_address = client.address || ""
        address = client.addresses.build(address_line_1: old_address, city: "", state: "", country: "", pin: "")
        address.save!(validate: false)
      end
    end
  end
end
