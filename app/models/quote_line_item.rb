# frozen_string_literal: true

# == Schema Information
#
# Table name: quote_line_items
#
#  id                       :bigint           not null, primary key
#  comment                  :text
#  description              :text
#  estimated_hours          :bigint
#  name                     :string
#  number_of_resource       :integer
#  resource_expertise_level :integer
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  lead_line_item_id        :bigint
#  lead_quote_id            :bigint           not null
#
# Indexes
#
#  index_quote_line_items_on_lead_line_item_id  (lead_line_item_id)
#  index_quote_line_items_on_lead_quote_id      (lead_quote_id)
#
# Foreign Keys
#
#  fk_rails_...  (lead_quote_id => lead_quotes.id)
#
class QuoteLineItem < ApplicationRecord
  belongs_to :lead_line_item, optional: true
  belongs_to :lead_quote
  validates :name, presence: true
end
