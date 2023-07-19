# frozen_string_literal: true

class AddCompanyIdToClientMembers < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!
  def up
    add_reference :client_members, :company, null: true, index: { algorithm: :concurrently }

    ClientMember.find_each do |client_member|
      unless client_member.company_id
        company_id = client_member.client.company_id
        client_member.update_column(:company_id, company_id) if company_id
      end
    end
  end

  def down
    remove_reference :client_members, :company, index: false
  end
end
