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
#  discarded_at           :datetime
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
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
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  unconfirmed_email      :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  current_workspace_id   :bigint
#  department_id          :integer
#  invited_by_id          :bigint
#
# Indexes
#
#  index_users_on_current_workspace_id  (current_workspace_id)
#  index_users_on_discarded_at          (discarded_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_invitation_token      (invitation_token) UNIQUE
#  index_users_on_invited_by            (invited_by_type,invited_by_id)
#  index_users_on_invited_by_id         (invited_by_id)
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (current_workspace_id => companies.id)
#

# frozen_string_literal: true

class User < ApplicationRecord
  include Discard::Model

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
    DepartmentOptionKlass.new("Sales", 18),
    DepartmentOptionKlass.new("Shopify", 19)
  ]

  # Associations
  has_many :company_users, dependent: :destroy
  has_many :companies, through: :company_users
  has_many :project_members, dependent: :destroy
  has_many :timesheet_entries
  has_many :identities, dependent: :delete_all
  has_one :wise_account, dependent: :destroy
  has_one_attached :avatar
  rolify strict: true

  # Validations
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 50 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :invitable, :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable,
    :trackable, :confirmable,
    :omniauthable, omniauth_providers: [:google_oauth2]

  # Callbacks
  after_discard :discard_project_members

  def primary_role
    return "employee" if roles.empty?

    roles.first.name
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def department_name
    return "" if department_id.nil?

    department_name_hash = User::DEPARTMENT_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }
    department_name_hash[department_id]
  end

  def active_for_authentication?
    super and self.kept?
  end

  def has_owner_or_admin_role?(company)
    return false if company.nil?

    self.has_cached_role?(:owner, company) || self.has_cached_role?(:admin, company)
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

  private

    def discard_project_members
      project_members.discard_all
    end
end
