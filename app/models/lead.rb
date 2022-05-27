# frozen_string_literal: true

# == Schema Information
#
# Table name: leads
#
#  id                 :bigint           not null, primary key
#  address            :text
#  base_currency      :string           default("USD")
#  budget_amount      :decimal(, )      default(0.0)
#  budget_status_code :integer
#  country            :string
#  description        :string
#  discarded_at       :datetime
#  donotbulkemail     :boolean          default(FALSE)
#  donotemail         :boolean          default(FALSE)
#  donotfax           :boolean          default(FALSE)
#  donotphone         :boolean          default(FALSE)
#  industry_code      :integer
#  linkedinid         :string
#  mobilephone        :string
#  name               :string
#  other_email        :string
#  primary_email      :string
#  priority           :integer
#  quality_code       :integer
#  skypeid            :string
#  state_code         :integer
#  status_code        :integer
#  telephone          :string
#  timezone           :string
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
# Indexes
#
#  index_leads_on_discarded_at  (discarded_at)
#
class Lead < ApplicationRecord
  include Discard::Model
  default_scope -> { kept }

  CodeOptionKlass = Struct.new(:name, :id)

  BUDGET_STATUS_CODE_OPTIONS = [
    CodeOptionKlass.new("No Committed Budget", 0),
    CodeOptionKlass.new("May Buy", 1),
    CodeOptionKlass.new("Can Buy", 2),
    CodeOptionKlass.new("Will Buy", 3)
  ]

  QUALITY_CODE_OPTIONS = [
    CodeOptionKlass.new("Hot", 0),
    CodeOptionKlass.new("Warm", 1),
    CodeOptionKlass.new("Cold", 2)
  ]

  STATE_CODE_OPTIONS = [
    CodeOptionKlass.new("Open", 0),
    CodeOptionKlass.new("Qualified", 1),
    CodeOptionKlass.new("Disqualified", 2)
  ]

  STATUS_CODE_OPTIONS = [
    CodeOptionKlass.new("New", 0),
    CodeOptionKlass.new("Contacted", 1),
    CodeOptionKlass.new("Qualified", 2),
    CodeOptionKlass.new("Lost", 3),
    CodeOptionKlass.new("Cannot Contact", 4),
    CodeOptionKlass.new("No Longer Interested", 5),
    CodeOptionKlass.new("Canceled", 6),
  ]

  INDUSTRY_CODE_OPTIONS = [
    CodeOptionKlass.new("Accounting", 0),
    CodeOptionKlass.new("Agriculture and Non-petrol Natural Resource Extraction", 1),
    CodeOptionKlass.new("Broadcasting Printing and Publishing", 2),
    CodeOptionKlass.new("Brokers", 3),
    CodeOptionKlass.new("Building Supply Retail", 4),
    CodeOptionKlass.new("Business Services", 5),
    CodeOptionKlass.new("Consulting", 6),
    CodeOptionKlass.new("Consumer Services", 7),
    CodeOptionKlass.new("Design, Direction and Creative Management", 8),
    CodeOptionKlass.new("Distributors, Dispatchers and Processors", 9),
    CodeOptionKlass.new("Doctor's Offices and Clinics", 10),
    CodeOptionKlass.new("Durable Manufacturing", 11),
    CodeOptionKlass.new("Eating and Drinking Places", 12),
    CodeOptionKlass.new("Entertainment Retail", 13),
    CodeOptionKlass.new("Equipment Rental and Leasing", 14),
    CodeOptionKlass.new("Financial", 15),
    CodeOptionKlass.new("Food and Tobacco Processing", 16),
    CodeOptionKlass.new("Inbound Capital Intensive Processing", 17),
    CodeOptionKlass.new("Inbound Repair and Services", 18),
    CodeOptionKlass.new("Insurance", 19),
    CodeOptionKlass.new("Legal Services", 20),
    CodeOptionKlass.new("Non-Durable Merchandise Retail", 21),
    CodeOptionKlass.new("Outbound Consumer Service", 22),
    CodeOptionKlass.new("Petrochemical Extraction and Distribution", 23),
    CodeOptionKlass.new("Service Retail", 24),
    CodeOptionKlass.new("SIG Affiliations", 25),
    CodeOptionKlass.new("Social Services", 26),
    CodeOptionKlass.new("Special Outbound Trade Contractors", 27),
    CodeOptionKlass.new("Specialty Realty", 28),
    CodeOptionKlass.new("Transportation", 29),
    CodeOptionKlass.new("Utility Creation and Distribution", 30),
    CodeOptionKlass.new("Vehicle Retail", 31),
    CodeOptionKlass.new("Wholesale", 32)
  ]

  validates :name, presence: true
  # validates_format_of :primary_email, :other_email, :with => Devise::email_regexp
  # validates :budget_amount, numericality: { greater_than_or_equal_to: 0 }

  def lead_detail
    {
      id:, address:, base_currency:, budget_amount:, budget_status_code:,
      country:, description:, discarded_at:, donotbulkemail:,
      donotemail:, donotfax:, donotphone:, industry_code:,
      linkedinid:, mobilephone:, name:, other_email:, primary_email:,
      priority:, quality_code:, skypeid:, state_code:, status_code:,
      telephone:, timezone:
    }
  end
end
