# frozen_string_literal: true

module NavigationHelper
  def nav_helper(style: "", active_style: "block", inactive_style: "hidden")
    nav_links = nav_items.map do |item|
      if item[:permitted]
        link_to item[:title],
          item[:url],
          class: "#{style} #{active?(item[:url]) ? active_style : inactive_style}",
          data: item[:data]
      end
    end

    nav_links.join("").html_safe
  end

  private

    def nav_items
      [
        {
          url: time_tracking_index_path,
          title: I18n.t("navbar.time_tracking"),
          permitted: Pundit.policy!(current_user, :timesheet_entry).index?,
          data: { cy: "time-tracking-tab" }
        },
        {
          url: team_index_path,
          title: I18n.t("navbar.team"),
          permitted: Pundit.policy!(current_user, :team).index?,
          data: { cy: "team-tab" }
        },
        {
          url: clients_path,
          title: I18n.t("navbar.clients"),
          permitted: Pundit.policy!(current_user, :client).index?,
          data: { cy: "clients-tab" }
        },
        {
          url: projects_path,
          title: I18n.t("navbar.projects"),
          permitted: Pundit.policy!(current_user, :project).index?,
          data: { cy: "projects-tab" }
        },
        {
          url: "#{root_url}reports",
          title: I18n.t("navbar.reports"),
          permitted: Pundit.policy!(current_user, :report).index?,
          data: { cy: "reports-tab" }
        },
        {
          url: invoices_path,
          title: I18n.t("navbar.invoices"),
          permitted: Pundit.policy!(current_user, :invoice).index?,
          data: { cy: "invoices-tab" }
        },
        {
          url: payments_path,
          title: I18n.t("navbar.payments"),
          permitted: Pundit.policy!(current_user, :payment).index?,
          data: { cy: "payments-tab" }
        }
      ]
    end

    def active?(path)
      current_page?(path)
    end
end
