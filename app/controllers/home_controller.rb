# frozen_string_literal: true

class HomeController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index]
  skip_after_action :verify_authorized
  before_action :set_google_oauth_success
  after_action :add_agent_discovery_headers, only: [:index]

  def index
    if current_user && current_user.has_role?(:super_admin)
      redirect_to admin_root_path
    elsif markdown_request?
      render plain: agent_home_markdown, content_type: "text/markdown"
    else
      respond_to do |format|
        format.html { render }
        format.json { render json: { status: "ok", authenticated: user_signed_in? } }
        format.xml { render xml: { status: "ok", authenticated: user_signed_in? }.to_xml(root: "response") }
        format.js { head 404 }
        format.any { head 406 }
      end
    end
  end

  private

    def set_google_oauth_success
      @google_oauth_success = params[:google_oauth_success]
    end

    def markdown_request?
      request.headers["Accept"].to_s.downcase.include?("text/markdown")
    end

    def add_agent_discovery_headers
      links = [
        %(<#{root_url}>; rel="canonical"),
        %(</sitemap.xml>; rel="sitemap"; type="application/xml"),
        %(</llms.txt>; rel="service-desc"; type="text/plain"),
        %(</llms-full.txt>; rel="alternate"; type="text/markdown"),
        %(</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"),
        %(</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"),
        %(</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json")
      ]
      existing_link = response.headers["Link"].presence

      response.headers["Link"] = [existing_link, *links].compact.join(", ")
      response.headers["Content-Signal"] = "ai-train=yes, search=yes, ai-input=yes"
      response.headers["Vary"] = [response.headers["Vary"], "Accept"].compact.join(", ")
    end

    def agent_home_markdown
      <<~MARKDOWN
        ---
        title: Miru App
        description: Authenticated Miru application for time tracking, invoicing, expenses, payments, reports, API, CLI, and MCP workflows.
        canonical: #{root_url}
        ---

        # Miru App

        Miru is open-source time tracking, invoicing, expense management, payments, and reporting software for teams that bill by the hour.

        ## Agent-Useful Interfaces

        - OpenAPI: #{root_url}openapi.json
        - API catalog: #{root_url}.well-known/api-catalog
        - MCP endpoint: #{root_url}mcp
        - MCP Server Card: #{root_url}.well-known/mcp/server-card.json
        - Agent skills: #{root_url}.well-known/agent-skills/index.json
        - llms.txt: #{root_url}llms.txt

        ## Core Workflows

        - Track time entries by project, client, team member, date, duration, and note.
        - Manage clients, projects, workspaces, and team members.
        - Generate and send invoices from tracked work.
        - Record and review payments.
        - Create and report on expenses.
        - Use reports for time, revenue, outstanding invoices, and accounts aging.

        Agents should use the OpenAPI description or MCP endpoint with explicit user authorization instead of browser automation for authenticated work.
      MARKDOWN
    end
end
