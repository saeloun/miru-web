# frozen_string_literal: true

class AddAuthStateDigestToCliSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :cli_sessions, :auth_state_digest, :string
  end
end
