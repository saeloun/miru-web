# frozen_string_literal: true

class TruncateClientNameToClients < ActiveRecord::Migration[7.0]
  def change
    Client.find_each do |client|
      client.update(name: client.name.slice(0, 30), phone: client.phone.slice(0, 15))
    end
  end
end
