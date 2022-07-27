# frozen_string_literal: true

class RemoveDeviseInvitableColumnsFromUsers < ActiveRecord::Migration[7.0]
  def change
    remove_reference :users, :invited_by, polymorphic: true
    remove_columns :users, :invitations_count, :invitation_limit, :invitation_sent_at, :invitation_accepted_at,
      :invitation_token, :invitation_created_at
  end
end
