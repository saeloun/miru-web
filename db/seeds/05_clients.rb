# frozen_string_literal: true

# Client Create Start
client_india = { name: "client_1_saeloun_India", email: "client_one@saeloun_india.com", phone: "+91 9999999991", address: "Somewhere on Earth" }
client_us = { name: "client_1_saeloun_US", email: "client_one@saeloun_us.com", phone: "+91 9999999993", address: "Somewhere on Earth" }

@client_1_saeloun_india = @saeloun_india.clients.create!(client_india)
@client_1_saeloun_us =  @saeloun_us.clients.create!(client_us)
puts "Clients Created"
# Client Create End
