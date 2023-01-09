# frozen_string_literal: true

class ProjectMemberService
  attr_reader :members
  def initialize(members)
    @members = members
  end

  def process
    ActiveRecord::Base.transaction do
      add_new_members(members[:added_members])
      update_existing_members(members[:updated_members])
      remove_members(members[:removed_member_ids])
    end
  end

  def add_new_members(added_members)
    return if added_members.blank?

    added_members = added_members.filter_map do |member|
      next unless member.key?("hourly_rate")

      { user_id: member["id"], project_id: @project.id, hourly_rate: member["hourly_rate"] }
    end

    ProjectMember.create!(added_members)
  end

  def update_existing_members(updated_members)
    return if updated_members.blank?

    updated_members.each do |member_params|
      ProjectMember
        .where(user_id: member_params["id"], project_id: @project.id)
        .update!(hourly_rate: member_params["hourly_rate"])
    end
  end

  def remove_members(removed_members)
    return if removed_members.blank?

    @project.project_members.where(user_id: removed_members).discard_all
  end
end
