# frozen_string_literal: true

class Client::ShowPresenter
  attr_reader :client

  def initialize(client)
    @client = client
  end

  def process
    address = client.addresses&.last
    {
      id: client.id,
      name: client.name,
      email: client.email,
      address: {
        address_line_1: address&.address_line_1,
        address_line_2: address&.address_line_2,
        city: address&.city,
        state: address&.state,
        country: address&.country,
        pin: address&.pin
      },
      phone: client.phone,
      logo: client.logo_url
    }
  end
end
