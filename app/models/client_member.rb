# frozen_string_literal: true

class ClientMember < ApplicationRecord
  include Discard::Model

  belongs_to :client
  belongs_to :user
  belongs_to :company

  validates_uniqueness_of :client_id, scope: :user_id, message: "A client member with this client and user already exists"
end
