# frozen_string_literal: true

# Client Create Start
require_relative "constant"

client_common = { name: "common client", email: "client@common.com", phone: "+91 9999999990", address: "Somewhere on Earth" }
client_India = { name: "client_one saeloun_India", email: "client_one@saeloun_india.com", phone: "+91 9999999991", address: "Somewhere on Earth" }
client_US = { name: "client_one saeloun_US", email: "client_one@saeloun_us.com", phone: "+91 9999999993", address: "Somewhere on Earth" }


# Clients for Company India
[client_common, client_India].each do |client|
  SAELOUN_INDIA.clients.create!(client)
end

# Clients for Company US
[client_common, client_US].each do |client|
  SAELOUN_US.clients.create!(client)
end

puts "Clients Created"
# Client Create End
