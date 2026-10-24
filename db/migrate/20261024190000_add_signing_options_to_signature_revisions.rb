# frozen_string_literal: true

class AddSigningOptionsToSignatureRevisions < ActiveRecord::Migration[8.1]
  def change
    add_column :signature_request_revisions, :signing_options, :text
  end
end
