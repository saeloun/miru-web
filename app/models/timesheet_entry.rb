# frozen_string_literal: true

class TimesheetEntry < ApplicationRecord
  include Discard::Model
  include Searchable
  attribute :agent_id, :integer
  attribute :proof_url, :string
  attribute :source, :string, default: "manual"
  attribute :source_metadata, :json, default: {}
  attribute :proof_metadata, :json, default: {}
  attribute :review_status, :integer
  enum :bill_status, [:non_billable, :unbilled, :billed]
  enum :review_status, [:not_required, :pending_review, :approved, :rejected]

  SOURCES = %w[manual cli mcp automation import].freeze
  SOURCE_METADATA_KEYS = %w[tool skill mcp_server].freeze
  SOURCE_METADATA_MAX_LENGTH = 100
  PROOF_METADATA_MAX_KEYS = 20
  PROOF_METADATA_MAX_LENGTH = 200
  SOURCE_LABELS = {
    "manual" => "Manual",
    "cli" => "CLI",
    "mcp" => "MCP",
    "automation" => "Automation",
    "import" => "Import"
  }.freeze

  belongs_to :user
  belongs_to :project
  belongs_to :agent, optional: true

  pg_search_scope :pg_search,
    against: [:note],
    using: {
      tsearch: {
        prefix: true,
        dictionary: "english"
      }
    }

  has_one :invoice_line_item, dependent: :destroy
  has_one :client, through: :project
  has_one :company, through: :client

  before_validation :ensure_bill_status_is_set
  before_validation :ensure_review_status_is_set
  before_validation :ensure_bill_status_is_not_billed, on: :create
  before_validation :ensure_billed_status_should_not_be_changed, on: :update
  before_validation :normalize_source_fields
  before_validation :normalize_proof_metadata

  validates :duration, :work_date, :bill_status, :review_status, presence: true
  validates :duration, numericality: { less_than_or_equal_to: 6000000, greater_than_or_equal_to: 0.0 }
  validates :source, inclusion: { in: SOURCES }
  validates :proof_url, length: { maximum: 2000 }, allow_blank: true
  validate :validate_billable_project
  validate :validate_agent_belongs_to_workspace
  validate :prevent_edit_if_locked, on: :update

  scope :in_workspace, -> (company) { where(project_id: company&.project_ids) }
  scope :during, -> (from, to) { where(work_date: from..to).order(work_date: :desc) }

  delegate :name, to: :project, prefix: true, allow_nil: true
  delegate :name, to: :client, prefix: true, allow_nil: true
  delegate :full_name, to: :user, prefix: true, allow_nil: true

  # Alias for backward compatibility
  def user_name
    user_full_name
  end

  scope :search_import, -> { includes(:project, :client, :user) }


  def snippet
    {
      id:,
      project: project.name,
      project_id:,
      client: project.client.name,
      duration:,
      note:,
      work_date:,
      bill_status:,
      review_status:,
      team_member: user.full_name,
      agent_id:,
      agent_name: agent&.name,
      source:,
      source_label:,
      source_metadata:,
      proof_url:,
      proof_metadata:,
      type: "timesheet"
    }
  end

  def source_label
    return nil if source == "manual" && source_tool.blank?

    parts = []
    parts << source_tool_label if source_tool.present?
    parts << "via #{SOURCE_LABELS.fetch(source)}" if source != "manual"
    parts << SOURCE_LABELS.fetch(source) if parts.empty?
    parts.join(" ")
  end

  def source_tool
    source_metadata["tool"].presence
  end

  def source_tool_label
    source_tool.to_s.split(/[_-]/).reject(&:blank?).map(&:capitalize).join(" ")
  end

  def formatted_duration
    total_minutes = duration.to_i
    hours = total_minutes / 60
    minutes = total_minutes % 60
    format("%02d:%02d", hours, minutes)
  end

  def formatted_work_date
    CompanyDateFormattingService.new(work_date, company:).process
  end

  private

    def ensure_bill_status_is_set
      return if bill_status.present? || project.nil?

      if project.billable
        self.bill_status = :unbilled
      else
        self.bill_status = :non_billable
      end
    end

    def ensure_review_status_is_set
      if agent.present?
        self.review_status = :pending_review if review_status.blank? || review_status == "not_required"
        return
      end

      return if review_status.present?

      self.review_status = :not_required
    end

    def ensure_bill_status_is_not_billed
      errors.add(:timesheet_entry, I18n.t(:errors)[:create_billed_entry]) if billed?
    end

    def ensure_billed_status_should_not_be_changed
      return if Current.user.nil?

      errors.add(:timesheet_entry, I18n.t(:errors)[:bill_status_billed]) if
      self.bill_status_changed? && self.bill_status_was == "billed" && Current.user.primary_role(Current.company) == "employee"
    end

    def validate_billable_project
      if !project&.billable && bill_status == "unbilled"
        errors.add(:base, I18n.t("errors.validate_billable_project"))
      end
    end

    def validate_agent_belongs_to_workspace
      return if agent.blank?

      if company.blank? || agent.company_id != company.id
        errors.add(:agent, "must belong to the same company")
      end

      errors.add(:user, "must match the agent user") if user_id.present? && agent.user_id != user_id
    end

    def prevent_edit_if_locked
      return if Current.user.nil?

      if locked && Current.user.primary_role(Current.company) == "employee"
        errors.add(:base, "Cannot edit a locked timesheet entry. Please contact admin.")
      end
    end

    def normalize_source_fields
      self.source_metadata = normalized_source_metadata
      self.source = inferred_source
    end

    def normalize_proof_metadata
      self.proof_metadata = normalized_proof_metadata
    end

    def normalized_source_metadata
      return {} unless source_metadata.is_a?(Hash)

      source_metadata.deep_stringify_keys
        .slice(*SOURCE_METADATA_KEYS)
        .transform_values { |value| normalized_source_metadata_value(value) }
        .compact_blank
    end

    def normalized_source_metadata_value(value)
      value.to_s.strip.presence&.slice(0, SOURCE_METADATA_MAX_LENGTH)
    end

    def normalized_proof_metadata
      return {} unless proof_metadata.is_a?(Hash)

      proof_metadata.deep_stringify_keys.each_with_object({}).with_index do |((key, value), acc), index|
        break acc if index >= PROOF_METADATA_MAX_KEYS

        normalized_value = normalized_proof_metadata_value(value)
        next if normalized_value.blank? && normalized_value != false && normalized_value != 0

        acc[key.to_s.slice(0, SOURCE_METADATA_MAX_LENGTH)] = normalized_value
      end
    end

    def normalized_proof_metadata_value(value)
      case value
      when Numeric, TrueClass, FalseClass
        value
      else
        value.to_s.strip.presence&.slice(0, PROOF_METADATA_MAX_LENGTH)
      end
    end

    def inferred_source
      return "mcp" if source_metadata["mcp_server"].present?
      return "automation" if source_metadata["tool"].present?

      normalized_source = source.to_s.presence || "manual"
      normalized_source = normalized_source.downcase
      SOURCES.include?(normalized_source) ? normalized_source : "manual"
    end
end
