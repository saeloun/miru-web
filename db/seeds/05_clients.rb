# frozen_string_literal: true

# Client Create Start
client_India = { name: "client_1__saeloun_India", email: "client_one@saeloun_india.com", phone: "+91 9999999991", address: "Somewhere on Earth" }
client_us = { name: "client_1__saeloun_US", email: "client_one@saeloun_us.com", phone: "+91 9999999993", address: "Somewhere on Earth" }

[client_India].each { | client | @saeloun_India.clients.create!(client) }
[client_us].each { | client | @saeloun_us.clients.create!(client) }
puts "Clients Created"

@client_1__saeloun_India = Client.find_by_company_id_and_name(@saeloun_India, "client_1__saeloun_India")
@client_1__saeloun_us = Client.find_by_company_id_and_name(@saeloun_us, "client_1__saeloun_US")
# Client Create End
