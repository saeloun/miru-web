# frozen_string_literal: true

module NavigationHelper
  def nav_helper(style: "", active_style: "block", inactive_style: "hidden")
    nav_links = nav_items.map do |item|
      next if item[:other].present?
      next unless item[:permitted]

      link_to item[:title],
        item[:url],
        class: "#{style} #{active?(item[:url]) ? active_style : inactive_style}",
        data: item[:data]
    end

    nav_links.join("").html_safe
  end

  def other_nav_helper(style: "")
    nav_links = nav_items.map do |item|
      next if item[:other].blank?
      next unless item[:permitted]

      content_tag(
        :div,
        class: "bg-miru-gray-100 items-center px-4 py-4 hover:bg-miru-gray-100
        text-miru-dark-purple-1000 cursor-pointer rounded-sm") do
        link_to item[:title],
          item[:url],
          class: "#{style} flex",
          data: item[:data]
      end
    end

    nav_links.join("").html_safe
  end

  private

    def nav_items
      [
        {
          url: space_occupying_index_path,
          title: I18n.t("navbar.spaces"),
          permitted: Pundit.policy!(current_user, :space_usage).index?,
          data: { cy: "spaces-tab" }
        },
        {
          url: time_tracking_index_path,
          title: I18n.t("navbar.time_tracking"),
          permitted: Pundit.policy!(current_user, :timesheet_entry).index?,
          data: { cy: "time-tracking-tab" },
          other: true
        },
        {
          url: leads_path,
          title: I18n.t("navbar.leads"),
          permitted: Pundit.policy!(current_user, :lead).index?,
          data: { cy: "leads-tab" }
        },
        {
          url: engagements_path,
          title: I18n.t("navbar.engagements"),
          permitted: Pundit.policy!(current_user, :engagement).index?,
          data: { cy: "engagements-tab" }
        },
        {
          url: devices_path,
          title: I18n.t("navbar.devices"),
          permitted: Pundit.policy!(current_user, :device).index?,
          data: { cy: "devices-tab" },
          other: true
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
          data: { cy: "clients-tab" },
          other: true
        },
        {
          url: projects_path,
          title: I18n.t("navbar.projects"),
          permitted: Pundit.policy!(current_user, :project).index?,
          data: { cy: "projects-tab" },
          other: true
        },
        {
          url: reports_path,
          title: I18n.t("navbar.reports"),
          permitted: Pundit.policy!(current_user, :report).index?,
          data: { cy: "reports-tab" },
          other: true
        },
        {
          url: invoices_path,
          title: I18n.t("navbar.invoices"),
          permitted: Pundit.policy!(current_user, :invoice).index?,
          data: { cy: "invoices-tab" },
          other: true
        },
        {
          url: recruitments_path,
          title: I18n.t("navbar.recruitment"),
          permitted: true,
          data: { cy: "recruitment-tab" },
          other: true
        },
        # TODO:- Temprary disabling this feature (navbar payment links)
        # {
        #   url: payments_path,
        #   title: I18n.t("navbar.payments"),
        #   permitted: Pundit.policy!(current_user, :payment).index?,
        #   data: { cy: "payments-tab" }
        # }
      ]
    end

    def active?(path)
      current_page?(path)
    end
end
