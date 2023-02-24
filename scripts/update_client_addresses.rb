# frozen_string_literal: true

# ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
# This script copies the client address from the address field to the address_line_1 field of the Address model.
# ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

# We have few records of the client i.e 73 because of that I used each.
def copy_address_into_address_table
  Client.find_each do |client|
    address_record = client.address
    unless address_record.present?
      address = client.build_address(address_line_1: client&.old_address, city: "", state: "", country: "", pin: "")
      address.save(validate: false)
    end
  end
end

copy_address_into_address_table
