# frozen_string_literal: true

# == Schema Information
#
# Table name: candidates
#
#  id                            :bigint           not null, primary key
#  address                       :text
#  country                       :string
#  cover_letter                  :text
#  description                   :string
#  discarded_at                  :datetime
#  email                         :string
#  emails                        :text             default([]), is an Array
#  first_name                    :string
#  initial_communication         :integer
#  last_name                     :string
#  linkedinid                    :string
#  mobilephone                   :string
#  preferred_contact_method_code :integer
#  skypeid                       :string
#  source_code                   :integer
#  status_code                   :integer
#  tech_stack_ids                :text             default([]), is an Array
#  telephone                     :string
#  title                         :string
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  assignee_id                   :bigint
#  company_id                    :bigint
#  consultancy_id                :bigint
#  created_by_id                 :bigint
#  reporter_id                   :bigint
#  updated_by_id                 :bigint
#
# Indexes
#
#  index_candidates_on_assignee_id     (assignee_id)
#  index_candidates_on_company_id      (company_id)
#  index_candidates_on_consultancy_id  (consultancy_id)
#  index_candidates_on_created_by_id   (created_by_id)
#  index_candidates_on_discarded_at    (discarded_at)
#  index_candidates_on_reporter_id     (reporter_id)
#  index_candidates_on_updated_by_id   (updated_by_id)
#
class Candidate < ApplicationRecord
  include Discard::Model

  CodeOptionKlass = Struct.new(:name, :id)

  STATUS_CODE_OPTIONS = [
    CodeOptionKlass.new("New", 0),
    CodeOptionKlass.new("Contacted", 1),
    CodeOptionKlass.new("Qualified", 2),
    CodeOptionKlass.new("Lost", 3),
    CodeOptionKlass.new("Cannot Contact", 4),
    CodeOptionKlass.new("No Longer Interested", 5),
    CodeOptionKlass.new("Canceled", 6),
  ]

  PREFERRED_CONTACT_METHOD_CODE_OPTIONS = [
    CodeOptionKlass.new("Any", 0),
    CodeOptionKlass.new("Email", 1),
    CodeOptionKlass.new("Phone", 2),
    CodeOptionKlass.new("Mail", 3)
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

  belongs_to :consultancy, optional: true
  belongs_to :assignee, class_name: :User, optional: true
  belongs_to :reporter, class_name: :User, optional: true
  belongs_to :created_by, class_name: :User, optional: true
  belongs_to :updated_by, class_name: :User, optional: true
  belongs_to :company, optional: true

  # Validations
  validates :first_name, presence: true

  validates :email, uniqueness: true, format: { with: Devise.email_regexp }
  before_validation :assign_default_values

  def assign_default_values
    self.updated_by_id = self.created_by_id if self.updated_by_id.blank? && self.created_by_id.present?
    self.status_code = Candidate::STATUS_CODE_OPTIONS.group_by(&:name)["New"].first.id if self.status_code.blank?
  end

  def preferred_contact_method_code_name_hash
    Candidate::PREFERRED_CONTACT_METHOD_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
  end

  def preferred_contact_method_code_name
    return "" if preferred_contact_method_code.nil?

    self.preferred_contact_method_code_name_hash[preferred_contact_method_code]
  end

  def source_code_name_hash
    Candidate::SOURCE_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
  end

  def source_code_name
    return "" if source_code.nil?

    self.source_code_name_hash[source_code]
  end

  def initial_communication_name_hash
    Candidate::INITIAL_COMMUNICATION_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
  end

  def initial_communication_name
    return "" if initial_communication.nil?

    self.initial_communication_name_hash[initial_communication]
  end

  def tech_stack_name_hash
    Candidate::TECH_STACK_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
  end

  def tech_stack_names
    return [] unless tech_stack_ids.present?

    (self.tech_stack_name_hash.select { |k, v| tech_stack_ids.include?(k) } || {}).values.flatten.compact.uniq
  end

  def status_code_name_hash
    Candidate::STATUS_CODE_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
  end

  def status_code_name
    return "" if status_code.nil?

    self.status_code_name_hash[status_code]
  end

  def assignee_name
    self.assignee ? self.assignee.full_name : ""
  end

  def reporter_name
    self.reporter ? self.reporter.full_name : ""
  end

  def created_by_name
    self.created_by ? self.created_by.full_name : ""
  end

  def updated_by_name
    self.updated_by ? self.updated_by.full_name : ""
  end

  def consultancy_name
    self.consultancy ? self.consultancy.name : ""
  end

  def name
    [self.title, self.first_name, self.last_name].compact_blank.join(" ")
  end

  def candidate_detail
    {
      id: self.id,
      company_id: self.company_id,
      address: self.address,
      country: self.country,
      description: self.description,
      cover_letter: self.cover_letter,
      discarded_at: self.discarded_at,
      linkedinid: self.linkedinid,
      skypeid: self.skypeid,
      mobilephone: self.mobilephone,
      telephone: self.telephone,
      title: self.title,
      first_name: self.first_name,
      last_name: self.last_name,
      name: self.name,
      email: self.email,
      emails: self.emails || [],
      status_code: self.status_code,
      assignee_id: self.assignee_id,
      assignee_name: self.assignee_name,
      reporter_id: self.reporter_id,
      reporter_name: self.reporter_name,
      created_by_id: self.created_by_id,
      created_by_name: self.created_by_name,
      updated_by_id: self.updated_by_id,
      updated_by_name: self.updated_by_name,
      consultancy_id: self.consultancy_id,
      consultancy_name: self.consultancy_name,
      preferred_contact_method_code: self.preferred_contact_method_code,
      preferred_contact_method_code_name: self.preferred_contact_method_code_name,
      source_code: self.source_code,
      source_code_name: self.source_code_name,
      initial_communication: self.initial_communication,
      initial_communication_name: self.initial_communication_name,
      tech_stack_ids: self.tech_stack_ids || [],
      tech_stack_names: self.tech_stack_names,
      status_code: self.status_code,
      status_code_name:	self.status_code_name
    }
  end
end
