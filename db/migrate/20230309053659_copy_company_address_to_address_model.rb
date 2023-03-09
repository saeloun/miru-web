# frozen_string_literal: true

class CopyCompanyAddressToAddressModel < ActiveRecord::Migration[7.0]
  def change
    Company.find_each do |company|
      puts " * * * * * * * * * Company* * * * * * * * Id: #{company.id}, Name: #{company.name}"
      address_record = company.current_address
      unless address_record.present?
        old_address = company.address || ""
        address = company.addresses.build(address_line_1: old_address, city: "", state: "", country: "", pin: "")
        address.save!(validate: false)
      end
    end
  end
end
