# frozen_string_literal: true

module ProjectSqlQueries
  extend ActiveSupport::Concern

  def project_members_snippet_sql(date_range)
    query = """
        SELECT
          pm.user_id as id,
          COALESCE(te.total_duration, 0) as minutes_logged,
          pm.hourly_rate as hourly_rate,
          COALESCE(ROUND((te.total_duration/60 * pm.hourly_rate)::numeric, 3), 0) as cost,
          CONCAT(u.first_name, ' ', u.last_name) as name
        FROM (
          SELECT user_id, SUM(duration) AS total_duration
          FROM timesheet_entries
          WHERE project_id = #{id} AND discarded_at IS NULL AND work_date BETWEEN '#{date_range.first}' AND '#{date_range.last}'
          GROUP BY user_id
        ) te
        RIGHT JOIN (
          SELECT user_id, hourly_rate
          FROM project_members
          WHERE project_id = #{id} AND discarded_at IS NULL
        ) pm ON pm.user_id = te.user_id
        LEFT JOIN users u ON u.id = pm.user_id;
      """
    ActiveRecord::Base.connection.execute(query).to_a.map(&:symbolize_keys)
  end
end
