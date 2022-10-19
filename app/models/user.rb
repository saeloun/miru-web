# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  color                  :string
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
#  engage_expires_at      :datetime
#  engage_updated_at      :datetime
#  engage_week_code       :integer
#  first_name             :string           not null
#  last_name              :string           not null
#  last_sign_in_at        :datetime
#  last_sign_in_ip        :string
#  phone                  :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  slack_member_info      :text
#  social_accounts        :jsonb
#  team_lead              :boolean          default(FALSE)
#  unconfirmed_email      :string
#  xteam_member_ids       :text             default([]), is an Array
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  current_workspace_id   :bigint
#  department_id          :integer
#  engage_updated_by_id   :bigint
#  personal_email_id      :string
#  slack_member_id        :string
#
# Indexes
#
#  index_users_on_current_workspace_id  (current_workspace_id)
#  index_users_on_discarded_at          (discarded_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_engage_updated_by_id  (engage_updated_by_id)
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#  index_users_on_slack_member_id       (slack_member_id) UNIQUE
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

  DepartmentOptionKlass = Struct.new(:name, :id, :color)
  SimpleKlass = Struct.new(:name, :id)

  DEPARTMENT_OPTIONS = [
    DepartmentOptionKlass.new(".Net", 0, "#3b4ece"),
    DepartmentOptionKlass.new("Analytics", 1, "#b904a3"),
    DepartmentOptionKlass.new("Design", 2, "#60bac2"),
    DepartmentOptionKlass.new("Digital", 3, "#36efa7"),
    DepartmentOptionKlass.new("HR", 4, "#a0262c"),
    DepartmentOptionKlass.new("Information", 5, "#963f07"),
    DepartmentOptionKlass.new("Magento", 6, "#b75aea"),
    DepartmentOptionKlass.new("Management", 7, "#bd8548"),
    DepartmentOptionKlass.new("Meanstack", 8, "#a9b784"),
    DepartmentOptionKlass.new("Mobile", 9, "#a43aab"),
    DepartmentOptionKlass.new("Odoo", 10, "#5fb222"),
    DepartmentOptionKlass.new("PHP", 11, "#e17e51"),
    DepartmentOptionKlass.new("QA", 12, "#660b1d"),
    DepartmentOptionKlass.new("ROR", 13, "#5984bc"),
    DepartmentOptionKlass.new("React", 14, "#019d5d"),
    DepartmentOptionKlass.new("SEO", 15, "#e078b6"),
    DepartmentOptionKlass.new("SRE", 16, "#4cc8fb"),
    DepartmentOptionKlass.new("Sales", 17, "#784457"),
    DepartmentOptionKlass.new("Shopify", 18, "#c63c9b")
  ]

  # Associations
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
  has_many :engagement_timestamps, dependent: :destroy
  has_and_belongs_to_many :team_members, association_foreign_key: :member_user_id, class_name: User.name,
    join_table: "team_members", dependent: :destroy
  has_many :invitations, foreign_key: "sender_id", dependent: :destroy

  rolify strict: true

  # Social account details
  store_accessor :social_accounts, :github_url, :linkedin_url

  # Attribute accessor
  attr_accessor :current_company, :role, :skip_password_validation

  # Validations
  after_initialize :set_default_social_accounts, if: :new_record?
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 50 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable :registerable
  devise :database_authenticatable,
    :recoverable, :rememberable, :validatable,
    :trackable,
    :omniauthable, omniauth_providers: [:google_oauth2]

  # Callbacks
  after_discard :discard_project_members
  after_commit :set_employee_role_and_workspace, on: [:create]

  def having_department?(department_id)
    sales_department_id = User::DEPARTMENT_OPTIONS.detect { |department| department.id == department_id.to_i }&.id
    self.department_id == sales_department_id
  end

  # scopes
  scope :valid_invitations, -> { invitations.where(sender: self).valid_invitations }

  def primary_role(company)
    roles = self.roles.where(resource: company)
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

  def active_for_authentication?
    super and self.kept?
  end

  def current_workspace(load_associations: [:logo_attachment])
    @_current_workspace ||= Company.includes(load_associations).find_by(id: current_workspace_id)
  end

  def current_workspace=(workspace)
    write_attribute(:current_workspace_id, workspace&.id)
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

  def create_reset_password_token
    raw, hashed = Devise.token_generator.generate(User, :reset_password_token)
    self.reset_password_token = hashed
    self.reset_password_sent_at = Time.now.utc
    self.save
    raw # This value will be used to redirect users to the reset password page
 end

  def employed_at?(company_id)
    employments.exists?(company_id:)
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

    def password_required?
      return false if skip_password_validation

      super
    end
end
