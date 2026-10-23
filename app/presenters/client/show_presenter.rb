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
      legal_name: client.legal_name,
      finance_email: client.finance_email,
      signatory_name: client.signatory_name,
      signatory_designation: client.signatory_designation,
      signatory_email: client.signatory_email,
      address: client.current_address,
      phone: client.phone,
      logo: client.logo_url,
      currency: client.currency,
      signature_enabled: client.signature_enabled
    }
  end
end
