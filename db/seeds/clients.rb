# frozen_string_literal: true

# Client Create Start
saeloun_India, saeloun_US = Company.first(2)

clients = [
    { name: "common client", email: "client@common.com", phone: "+91 9999999990", address: "Somewhere on Earth" },
    { name: "client_one saeloun_India", email: "client_one@company_india.com", phone: "+91 9999999991", address: "Somewhere on Earth" },
    { name: "client_one saeloun_US", email: "client_one@company_us.com", phone: "+91 9999999993", address: "Somewhere on Earth" }
]

# Clients for Company India
[0, 1].each do |client_id|
  saeloun_India.clients.create!(clients[client_id])
end

# Clients for Company US
[0, 2].each do |client_id|
  saeloun_US.clients.create!(clients[client_id])
end

puts "Clients Created"
# Client Create End
