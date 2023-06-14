# frozen_string_literal: true

class ClientMember < ApplicationRecord
  belongs_to :client
  belongs_to :user
end
