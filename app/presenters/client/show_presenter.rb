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
      emails: client.emails,
      address: client.current_address,
      phone: client.phone,
      logo: client.logo_url
    }
  end
end
