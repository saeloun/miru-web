# frozen_string_literal: true

class CopyClientEmailToEmailsColumn < ActiveRecord::Migration[7.0]
  def change
    Client.find_each do |client|
      client.update(emails: client.email) if client.email.present?
    end
  end
end
