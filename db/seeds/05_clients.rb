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
wow = {
  name: "WOW", email: "support@wow.com", phone: "+1 9999999991",
  address: "Ahmedabad"
}
theand = {
  name: "The And", email: "support@theand.com", phone: "+91 9999999992",
  address: "Singapore"
}

@client1 = @c1.clients.create!(theand)
@client2 = @c1.clients.create!(wow)
@client3 = @c1.clients.create!(flipkart)
@client4 = @c2.clients.create!(flipkart)
@client5 = @c2.clients.create!(microsoft)

puts "Clients Created"
# Client Create End
