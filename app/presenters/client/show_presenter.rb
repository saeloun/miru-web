# frozen_string_literal: true

class Client::ShowPresenter
  attr_reader :client

  def initialize(client)
    @client = client
  end

  def process
    {
      id: client.id,
      name: client.name,
      email: client.email,
      address: client.addresses&.last,
      phone: client.phone,
      logo: client.logo_url
    }
  end
end
