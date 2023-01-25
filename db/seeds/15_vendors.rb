# frozen_string_literal: true

# vendor Start

@freshdesk_vendor_india = @saeloun_india.vendors.create!({ name: "Freshdesk" })
@ca_vendor_india = @saeloun_india.vendors.create!({ name: "CA firm" })
@insurance_vendor_india = @saeloun_india.vendors.create!({ name: "Insurance" })
@booking_vendor_india = @saeloun_india.vendors.create!({ name: "Booking" })
@pepperfry_vendor_india = @saeloun_india.vendors.create!({ name: "Pepperfry" })
@zomato_vendor_india = @saeloun_india.vendors.create!({ name: "Zomato" })
@apple_repair_vendor_india = @saeloun_india.vendors.create!({ name: "Apple maintenance" })

puts "Venors created"

# vendor End
