# frozen_string_literal: true

class ClientPresenter
  attr_reader :client

  def initialize(client)
    @client = client
  end

  def snippet
    {
      id: client.id,
      name: client.name,
      email: client.email,
      address: client.address,
      phone: client.phone,
      logo: client.logo_url
    }
  end
end
