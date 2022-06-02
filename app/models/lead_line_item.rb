# frozen_string_literal: true

# == Schema Information
#
# Table name: lead_line_items
#
#  id                       :bigint           not null, primary key
#  description              :text
#  discarded_at             :datetime
#  kind                     :integer
#  name                     :string
#  number_of_resource       :integer
#  price                    :float
#  resource_expertise_level :integer
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  lead_id                  :bigint           not null
#
# Indexes
#
#  index_lead_line_items_on_discarded_at  (discarded_at)
#  index_lead_line_items_on_lead_id       (lead_id)
#
# Foreign Keys
#
#  fk_rails_...  (lead_id => leads.id)
#
class LeadLineItem < ApplicationRecord
  include Discard::Model

  KindOptionKlass = Struct.new(:name, :id)

  KIND_OPTIONS = [
    KindOptionKlass.new("Product", 0),
    KindOptionKlass.new("Bundle", 1),
    KindOptionKlass.new("Required Bundle Product", 2),
    KindOptionKlass.new("Optional Bundle Product", 3),
    KindOptionKlass.new("Project-based Service", 4),
  ]

  belongs_to :lead
  has_and_belongs_to_many :lead_quotes

  def kind_name
    return "" if kind.nil?

    kind_name_hash = LeadLineItem::KIND_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    kind_name_hash[kind]
  end

  def render_properties
    {
      id:, name:, kind:, description:, price:,
      number_of_resource:, resource_expertise_level:
    }
  end
end
