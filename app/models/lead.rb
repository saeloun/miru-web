# frozen_string_literal: true

# == Schema Information
#
# Table name: leads
#
#  id                            :bigint           not null, primary key
#  address                       :text
#  base_currency                 :string           default("USD")
#  budget_amount                 :decimal(, )      default(0.0)
#  budget_status_code            :integer
#  country                       :string
#  description                   :string
#  discarded_at                  :datetime
#  donotbulkemail                :boolean          default(FALSE)
#  donotemail                    :boolean          default(FALSE)
#  donotfax                      :boolean          default(FALSE)
#  donotphone                    :boolean          default(FALSE)
#  email                         :string
#  emails                        :text             default([]), is an Array
#  first_name                    :string
#  industry_code                 :integer
#  initial_communication         :integer
#  last_name                     :string
#  linkedinid                    :string
#  mobilephone                   :string
#  name                          :string
#  need                          :integer
#  preferred_contact_method_code :integer
#  priority_code                 :integer
#  quality_code                  :integer
#  skypeid                       :string
#  source_code                   :integer
#  state_code                    :integer
#  status_code                   :integer
#  tech_stack_ids                :text             default([]), is an Array
#  telephone                     :string
#  timezone                      :string
#  title                         :string
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  assignee_id                   :bigint
#  company_id                    :bigint
#  created_by_id                 :bigint
#  reporter_id                   :bigint
#  updated_by_id                 :bigint
#
# Indexes
#
#  index_leads_on_assignee_id    (assignee_id)
#  index_leads_on_company_id     (company_id)
#  index_leads_on_created_by_id  (created_by_id)
#  index_leads_on_discarded_at   (discarded_at)
#  index_leads_on_reporter_id    (reporter_id)
#  index_leads_on_updated_by_id  (updated_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (assignee_id => users.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (reporter_id => users.id)
#  fk_rails_...  (updated_by_id => users.id)
#
class Lead < ApplicationRecord
  include Discard::Model

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

  NEED_OPTIONS = [
    CodeOptionKlass.new("Must have", 0),
    CodeOptionKlass.new("Should have", 1),
    CodeOptionKlass.new("Good to have", 2),
    CodeOptionKlass.new("No need", 3)
  ]

  PREFERRED_CONTACT_METHOD_CODE_OPTIONS = [
    CodeOptionKlass.new("Any", 0),
    CodeOptionKlass.new("Email", 1),
    CodeOptionKlass.new("Phone", 2),
    CodeOptionKlass.new("Fax", 3),
    CodeOptionKlass.new("Mail", 4)
  ]

  INITIAL_COMMUNICATION_OPTIONS = [
    CodeOptionKlass.new("Contacted", 0),
    CodeOptionKlass.new("Not Contacted", 1)
  ]

  SOURCE_CODE_OPTIONS = [
    CodeOptionKlass.new("Other", 0),
    CodeOptionKlass.new("Public", 1),
    CodeOptionKlass.new("Company Business Site", 2),
    CodeOptionKlass.new("E-Mail Marketing", 3),
    CodeOptionKlass.new("Facebook", 4),
    CodeOptionKlass.new("Google", 5),
    CodeOptionKlass.new("Internal", 6),
    CodeOptionKlass.new("LinkedIn", 7),
    CodeOptionKlass.new("Partner", 8),
    CodeOptionKlass.new("Employee Referral", 9),
    CodeOptionKlass.new("External Referral", 10),
    CodeOptionKlass.new("Public Relations", 11),
    CodeOptionKlass.new("Seminar", 12),
    CodeOptionKlass.new("Trade Show", 13),
    CodeOptionKlass.new("Web", 14),
    CodeOptionKlass.new("Word of Mouth", 15)
  ]

  PRIORITY_CODE_OPTIONS = [
    CodeOptionKlass.new("Lowest", 0),
    CodeOptionKlass.new("Low", 1),
    CodeOptionKlass.new("Normal", 2),
    CodeOptionKlass.new("High", 3),
    CodeOptionKlass.new("Highest", 4)
  ]

  TECH_STACK_OPTIONS = [
    CodeOptionKlass.new("API Integration", 0),
    CodeOptionKlass.new("ASP .NET", 1),
    CodeOptionKlass.new("Android App", 2),
    CodeOptionKlass.new("AngularJS", 3),
    CodeOptionKlass.new("Beacon App", 4),
    CodeOptionKlass.new("CakePHP", 5),
    CodeOptionKlass.new("Codeigniter", 6),
    CodeOptionKlass.new("Content Management", 7),
    CodeOptionKlass.new("Custom Web", 8),
    CodeOptionKlass.new("DevOps", 9),
    CodeOptionKlass.new("DevOps Services", 10),
    CodeOptionKlass.new("Drupal", 11),
    CodeOptionKlass.new("Enterprise App", 12),
    CodeOptionKlass.new("Flutter App", 14),
    CodeOptionKlass.new("Full Stack Development", 15),
    CodeOptionKlass.new("HTML5", 16),
    CodeOptionKlass.new("Hybrid App", 17),
    CodeOptionKlass.new("IoT App", 18),
    CodeOptionKlass.new("Ionic", 19),
    CodeOptionKlass.new("Laravel", 20),
    CodeOptionKlass.new("Magento App", 21),
    CodeOptionKlass.new("Maintenance and Support", 22),
    CodeOptionKlass.new("Mean Stack Development", 23),
    CodeOptionKlass.new("Microsoft ", 24),
    CodeOptionKlass.new("Mobile App", 25),
    CodeOptionKlass.new("NodeJS", 26),
    CodeOptionKlass.new("PERL", 27),
    CodeOptionKlass.new("PHP", 28),
    CodeOptionKlass.new("Power BI", 29),
    CodeOptionKlass.new("Python", 30),
    CodeOptionKlass.new("QA", 31),
    CodeOptionKlass.new("React Native App", 33),
    CodeOptionKlass.new("ReactJS", 34),
    CodeOptionKlass.new("Ruby On Rails", 35),
    CodeOptionKlass.new("Shopify App", 36),
    CodeOptionKlass.new("Swift", 37),
    CodeOptionKlass.new("VueJS", 38),
    CodeOptionKlass.new("Wearable App", 39),
    CodeOptionKlass.new("Web Portal", 40),
    CodeOptionKlass.new("WebRTC Application", 41),
    CodeOptionKlass.new("Xamarin App", 42),
    CodeOptionKlass.new("iOS App", 43),
    CodeOptionKlass.new("iPad App", 44),
    CodeOptionKlass.new("iPhone App", 45)
  ]

  belongs_to :assignee, class_name: :User, optional: true
  belongs_to :reporter, class_name: :User, optional: true
  belongs_to :created_by, class_name: :User, optional: true
  belongs_to :updated_by, class_name: :User, optional: true
  belongs_to :company, optional: true

  has_many :lead_line_items, dependent: :destroy
  has_many :lead_quotes, dependent: :destroy
  has_many :lead_timelines, dependent: :destroy

  validates :first_name, :last_name, presence: true
  before_validation :assign_default_values

  def assign_default_values
    self.name = "#{self.first_name} #{self.last_name}"
    self.updated_by_id = self.created_by_id if self.updated_by_id.blank? && self.created_by_id.present?
    self.status_code = Lead::STATUS_CODE_OPTIONS.group_by(&:name)["New"].first.id if self.status_code.blank?
  end

  def budget_status_code_name
    return "" if budget_status_code.nil?

    code_name_hash = Lead::BUDGET_STATUS_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[budget_status_code]
  end

  def industry_code_name
    return "" if industry_code.nil?

    code_name_hash = Lead::INDUSTRY_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[industry_code]
  end

  def quality_code_name
    return "" if quality_code.nil?

    code_name_hash = Lead::QUALITY_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[quality_code]
  end

  def state_code_name
    return "" if state_code.nil?

    code_name_hash = Lead::STATE_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[state_code]
  end

  def status_code_name
    return "" if status_code.nil?

    code_name_hash = Lead::STATUS_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[status_code]
  end

  def need_name
    return "" if need.nil?

    code_name_hash = Lead::NEED_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[need]
  end

  def preferred_contact_method_code_name
    return "" if preferred_contact_method_code.nil?

    code_name_hash = Lead::PREFERRED_CONTACT_METHOD_CODE_OPTIONS.group_by(&:id).transform_values { |val|
  val.first.name
}
    code_name_hash[preferred_contact_method_code]
  end

  def initial_communication_name
    return "" if initial_communication.nil?

    code_name_hash = Lead::INITIAL_COMMUNICATION_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[initial_communication]
  end

  def source_code_name
    return "" if source_code.nil?

    code_name_hash = Lead::SOURCE_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[source_code]
  end

  def priority_code_name
    return "" if priority_code.nil?

    code_name_hash = Lead::PRIORITY_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    code_name_hash[priority_code]
  end

  def tech_stack_names
    return "" unless tech_stack_ids.present?

    code_name_hash = Lead::PRIORITY_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    (code_name_hash.select { |k, v| tech_stack_ids.include?(k) } || {}).values.flatten.compact.uniq
  end

  def lead_detail
    {
      id: self.id,
      address: self.address,
      base_currency: self.base_currency,
      budget_amount: self.budget_amount,
      budget_status_code: self.budget_status_code,
      country: self.country,
      description: self.description,
      discarded_at: self.discarded_at,
      donotbulkemail: self.donotbulkemail,
      donotemail: self.donotemail,
      donotfax: self.donotfax,
      donotphone: self.donotphone,
      industry_code: self.industry_code,
      linkedinid: self.linkedinid,
      mobilephone: self.mobilephone,
      name: self.name,
      email: self.email,
      quality_code: self.quality_code,
      skypeid: self.skypeid,
      state_code: self.state_code,
      status_code: self.status_code,
      telephone: self.telephone,
      timezone: self.timezone,
      assignee_id: self.assignee_id,
      reporter_id: self.reporter_id,
      created_by_id: self.created_by_id,
      updated_by_id: self.updated_by_id,
      need: self.need,
      preferred_contact_method_code: self.preferred_contact_method_code,
      initial_communication: self.initial_communication,
      first_name: self.first_name,
      last_name: self.last_name,
      source_code: self.source_code,
      tech_stack_ids: self.tech_stack_ids || [],
      emails: self.emails || [],
      priority_code: self.priority_code,
      title: self.title,
      company_id: self.company_id,
      budget_status_code_name: self.budget_status_code_name,
      industry_code_name:	self.industry_code_name,
      quality_code_name:	self.quality_code_name,
      state_code_name:	self.state_code_name,
      status_code_name:	self.status_code_name,
      assignee_name: self.assignee ? "#{self.assignee.first_name} #{self.assignee.last_name}" : "",
      reporter_name: self.reporter ? "#{self.reporter.first_name} #{self.reporter.last_name}" : "",
      created_by_name: self.created_by ? "#{self.created_by.first_name} #{self.created_by.last_name}" : "",
      updated_by_name: self.updated_by ? "#{self.updated_by.first_name} #{self.updated_by.last_name}" : "",
      need_name: self.need_name,
      preferred_contact_method_code_name: self.preferred_contact_method_code_name,
      initial_communication_name: self.initial_communication_name,
      source_code_name: self.source_code_name,
      priority_code_name: self.priority_code_name,
      tech_stack_names: self.tech_stack_names
    }
  end
end
