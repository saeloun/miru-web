# frozen_string_literal: true

# ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
# This script copies the company address from the address field to the address_line_1 field of the Address model.
# ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

# We have few records of the company i.e 140 because of that using each.
def copy_address_into_address_table
  Company.find_each do |company|
    address_record = company.address
    unless address_record.present?
        address = company.build_address(address_line_1: company&.address, city: "", state: "", country: "", pin: "")
        address.save(validate: false)
    end
  end
end

copy_address_into_address_table
