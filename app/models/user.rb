# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  confirmation_sent_at   :datetime
#  confirmation_token     :string
#  confirmed_at           :datetime
#  current_sign_in_at     :datetime
#  current_sign_in_ip     :string
#  date_of_birth          :date
#  discarded_at           :datetime
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  engage_code            :integer
#  engage_updated_at      :datetime
#  first_name             :string           not null
#  invitation_accepted_at :datetime
#  invitation_created_at  :datetime
#  invitation_limit       :integer
#  invitation_sent_at     :datetime
#  invitation_token       :string
#  invitations_count      :integer          default(0)
#  invited_by_type        :string
#  last_name              :string           not null
#  last_sign_in_at        :datetime
#  last_sign_in_ip        :string
#  phone                  :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  social_accounts        :jsonb
#  team_lead              :boolean          default(FALSE)
#  unconfirmed_email      :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  current_workspace_id   :bigint
#  department_id          :integer
#  engage_updated_by_id   :bigint
#  invited_by_id          :bigint
#  personal_email_id      :string
#
# Indexes
#
#  index_users_on_current_workspace_id  (current_workspace_id)
#  index_users_on_discarded_at          (discarded_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_engage_updated_by_id  (engage_updated_by_id)
#  index_users_on_invitation_token      (invitation_token) UNIQUE
#  index_users_on_invited_by            (invited_by_type,invited_by_id)
#  index_users_on_invited_by_id         (invited_by_id)
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (current_workspace_id => companies.id)
#  fk_rails_...  (engage_updated_by_id => users.id)
#

# frozen_string_literal: true

class User < ApplicationRecord
  include Discard::Model
  include Rails.application.routes.url_helpers

  DepartmentOptionKlass = Struct.new(:name, :id)

  DEPARTMENT_OPTIONS = [
    DepartmentOptionKlass.new(".Net", 0),
    DepartmentOptionKlass.new("Analytics", 1),
    DepartmentOptionKlass.new("Design", 2),
    DepartmentOptionKlass.new("Digital", 3),
    DepartmentOptionKlass.new("HR", 4),
    DepartmentOptionKlass.new("Information", 5),
    DepartmentOptionKlass.new("Magento", 6),
    DepartmentOptionKlass.new("Management", 7),
    DepartmentOptionKlass.new("Meanstack", 8),
    DepartmentOptionKlass.new("Mobile", 9),
    DepartmentOptionKlass.new("Odoo", 10),
    DepartmentOptionKlass.new("PHP", 11),
    DepartmentOptionKlass.new("QA", 12),
    DepartmentOptionKlass.new("ROR", 13),
    DepartmentOptionKlass.new("React", 14),
    DepartmentOptionKlass.new("SEO", 15),
    DepartmentOptionKlass.new("SRE", 16),
    DepartmentOptionKlass.new("Sales", 17),
    DepartmentOptionKlass.new("Shopify", 18)
  ]

  ENGAGEMENT_OPTIONS = [
    DepartmentOptionKlass.new("Free", 1),
    DepartmentOptionKlass.new("Partially", 2),
    DepartmentOptionKlass.new("Fully", 3),
    DepartmentOptionKlass.new("Over", 4),
  ]

  # Associations
  belongs_to :engage_updated_by, class_name: :User, optional: true
  has_many :employments, dependent: :destroy
  has_many :companies, through: :employments
  has_many :project_members, dependent: :destroy
  has_many :timesheet_entries
  has_many :space_usages
  has_many :identities, dependent: :delete_all
  has_one :wise_account, dependent: :destroy
  has_many :previous_employments, dependent: :destroy
  has_one_attached :avatar
  has_many :addresses, as: :addressable, dependent: :destroy
  has_many :devices, dependent: :destroy
  rolify strict: true

  # Social account details
  store_accessor :social_accounts, :github_url, :linkedin_url

  # Attribute accessor
  attr_accessor :current_company, :role

  # Validations
  after_initialize :set_default_social_accounts, if: :new_record?
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 50 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :invitable, :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable,
    :trackable,
    :omniauthable, omniauth_providers: [:google_oauth2]

  # Callbacks
  after_discard :discard_project_members
  after_commit :set_employee_role_and_workspace, on: [:create]

  def under_sales_department?
    sales_department_id = User::DEPARTMENT_OPTIONS.detect { |department| department.name == "Sales" }&.id
    self.department_id == sales_department_id
  end

  def can_access_lead?
    self.has_role?(
      :owner,
      self.current_workspace) || self.has_role?(
        :admin,
        self.current_workspace) || (self.has_role?(:employee, self.current_workspace) && self.under_sales_department?)
  end

  def can_access_space_usage?
    self.has_role?(
      :owner,
      self.current_workspace) || self.has_role?(
        :admin,
        self.current_workspace) || self.has_role?(:employee, self.current_workspace)
  end

  def primary_role
    return "employee" if roles.empty?

    roles.first.name
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def department_name
    return "" if department_id.nil?

    User::DEPARTMENT_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }[department_id]
  end

  def engage_name
    return "" if engage_code.nil?

    User::ENGAGEMENT_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }[engage_code]
  end

  def active_for_authentication?
    super and self.kept?
  end

  def current_workspace(load_associations: [:logo_attachment])
    @_current_workspace ||= Company.includes(load_associations).find_by(id: current_workspace_id)
  end

  def current_workspace=(workspace)
    write_attribute(:current_workspace_id, workspace&.id)
  end

  # https://github.com/scambra/devise_invitable/blob/7c4b1f6d19135b2cfed4685735a646a28bbc5191/test/rails_app/app/models/user.rb#L59
  def send_devise_notification(notification, *args)
    super
  end

  def assign_company_and_role
    return self.errors.add(:base, I18n.t("errors.internal_server_error")) if current_company.nil? || role.nil?

    ActiveRecord::Base.transaction do
      assign_company
      assign_role
    end
  end

  def avatar_url
    self.avatar.attached? ? rails_blob_path(self.avatar, disposition: "attachment", only_path: true) : ""
  end

  private

    def discard_project_members
      project_members.discard_all
    end

    def set_default_social_accounts
      self.social_accounts = {
        "github_url": "",
        "linkedin_url": ""
      }
    end

    def assign_company
      unless errors.present? ||
          companies.exists?(id: current_company.id)
        self.companies << current_company
      end
    end

    def assign_role
      if errors.empty? && current_company
        self.add_role(role.downcase.to_sym, current_company)
      end
    end

    def set_employee_role_and_workspace # TODO : Please fix
      company = Company.first

      ActiveRecord::Base.transaction do
        self.current_workspace_id = company.id
        self.companies << company
        self.add_role(:employee, company)

        self.save!
      end
    end
end
