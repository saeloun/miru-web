# frozen_string_literal: true

# Client Create Start
microsoft = {
  name: "Microsoft", email: "support@test-microsoft123.com", phone: "+1 9999999991",
  address: "California, USA"
}

flipkart = {
  name: "Flipkart", email: "support@test-flipkart123.com", phone: "+91 9999999992",
  address: "Singapore"
}

client_one = {
  name: "client_one", email: "contact@client_one.com", phone: "+91 1010101010",
  address: "Somewhere on Earth"
}

client_two = {
  name: "client_two", email: "contact@client_two.com", phone: "+91 2020202020"
}

@microsoft_client = @saeloun_india.clients.create!(microsoft)
@flipkart_client = @saeloun_india.clients.create!(flipkart)
@client_one_us = @saeloun_us.clients.create!(client_one)
@client_two_us = @saeloun_us.clients.create!(client_two)

puts "Clients Created"
# Client Create End
