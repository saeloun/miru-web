# == Schema Information
#
# Table name: invoices
#
#  id                 :integer          not null, primary key
#  issue_date         :date
#  due_date           :date
#  invoice_number     :string
#  reference          :text
#  amount             :float
#  outstanding_amount :float
#  sub_total          :float
#  tax                :float
#  amount_paid        :float
#  amount_due         :float
#  company_id         :integer          not null
#  client_id          :integer          not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
# Indexes
#
#  index_invoices_on_client_id                 (client_id)
#  index_invoices_on_company_id                (company_id)
#  index_invoices_on_company_id_and_client_id  (company_id,client_id) UNIQUE
#

# frozen_string_literal: true

class Invoice < ApplicationRecord
  belongs_to :company
  belongs_to :client
end
