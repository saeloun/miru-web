# frozen_string_literal: true

class AgentReadinessController < ActionController::Base
  before_action :set_agent_headers

  def api_catalog
    render json: {
      linkset: [
        {
          anchor: root_url,
          "https://www.iana.org/assignments/relation/service-desc": [
            {
              href: "#{root_url}openapi.json",
              type: "application/vnd.oai.openapi+json",
              title: "Miru OpenAPI description"
            },
            {
              href: "#{root_url}.well-known/mcp/server-card.json",
              type: "application/json",
              title: "Miru MCP Server Card"
            }
          ],
          "https://www.iana.org/assignments/relation/service-doc": [
            {
              href: "https://miru.so/docs",
              type: "text/html",
              title: "Miru documentation"
            },
            {
              href: "https://miru.so/ai-agents",
              type: "text/html",
              title: "Miru AI-agent guide"
            },
            {
              href: "#{root_url}llms-full.txt",
              type: "text/plain",
              title: "Miru app full LLM context"
            }
          ]
        }
      ]
    }, content_type: "application/linkset+json"
  end

  def mcp_server_card
    render json: {
      serverInfo: {
        name: "miru",
        title: "Miru MCP",
        version: miru_version,
        description: "MCP access for Miru time tracking, invoicing, payments, expenses, clients, and projects."
      },
      transports: [
        {
          type: "streamable-http",
          url: "#{root_url}mcp"
        }
      ],
      capabilities: {
        tools: true
      },
      authentication: {
        type: "bearer",
        description: "Use a Miru CLI or agent token authorized by the user."
      }
    }
  end

  def agent_skills
    render json: {
      name: "Miru",
      description: "Open-source time tracking, invoicing, expenses, payments, and automation for teams that bill by the hour.",
      skills: [
        {
          id: "miru-time-invoice-expense-automation",
          name: "Automate Miru billing workflows",
          description: "Use Miru OpenAPI or MCP to inspect workspaces, list clients and projects, manage time entries, send invoices, and create expenses with explicit user authorization.",
          input_modes: ["text", "application/json"],
          output_modes: ["text", "application/json"],
          resources: [
            "#{root_url}openapi.json",
            "#{root_url}mcp",
            "#{root_url}llms.txt",
            "https://miru.so/ai-agents",
            "https://miru.so/docs"
          ]
        }
      ]
    }
  end

  def openapi
    render json: openapi_document
  end

  private

    def set_agent_headers
      response.headers["Content-Signal"] = "ai-train=yes, search=yes, ai-input=yes"
    end

    def miru_version
      @miru_version ||= Rails.root.join("VERSION").read.strip
    rescue StandardError
      "3.0.0"
    end

    def openapi_document
      {
        openapi: "3.1.0",
        info: {
          title: "Miru API",
          version: miru_version,
          description: "Programmatic access to Miru time tracking, invoicing, clients, projects, expenses, payments, reports, CLI capabilities, and MCP support."
        },
        externalDocs: {
          description: "Miru API, MCP, CLI, and AI-agent guide",
          url: "https://miru.so/ai-agents"
        },
        servers: [
          { url: root_url.delete_suffix("/") }
        ],
        security: [
          { bearerAuth: [] }
        ],
        paths: {
          "/api/v1/users/_me": {
            get: {
              summary: "Get current authenticated user",
              security: [{ bearerAuth: [] }],
              responses: {
                "200": { description: "Current user and workspace context" },
                "401": { description: "Authentication required" }
              }
            }
          },
          "/api/v1/clients": {
            get: {
              summary: "List clients",
              security: [{ bearerAuth: [] }],
              responses: {
                "200": { description: "Clients visible to the authenticated user" }
              }
            },
            post: {
              summary: "Create a client",
              security: [{ bearerAuth: [] }],
              responses: {
                "201": { description: "Client created" },
                "422": { description: "Validation failed" }
              }
            }
          },
          "/api/v1/projects": {
            get: {
              summary: "List projects",
              security: [{ bearerAuth: [] }],
              responses: {
                "200": { description: "Projects visible to the authenticated user" }
              }
            }
          },
          "/api/v1/timesheet_entry": {
            get: {
              summary: "List time entries",
              security: [{ bearerAuth: [] }],
              responses: {
                "200": { description: "Time entries visible to the authenticated user" }
              }
            },
            post: {
              summary: "Create a time entry",
              security: [{ bearerAuth: [] }],
              responses: {
                "201": { description: "Time entry created" },
                "422": { description: "Validation failed" }
              }
            }
          },
          "/api/v1/invoices": {
            get: {
              summary: "List invoices",
              security: [{ bearerAuth: [] }],
              responses: {
                "200": { description: "Invoices visible to the authenticated user" }
              }
            },
            post: {
              summary: "Create an invoice",
              security: [{ bearerAuth: [] }],
              responses: {
                "201": { description: "Invoice created" },
                "422": { description: "Validation failed" }
              }
            }
          },
          "/api/v1/expenses": {
            get: {
              summary: "List expenses",
              security: [{ bearerAuth: [] }],
              responses: {
                "200": { description: "Expenses visible to the authenticated user" }
              }
            }
          },
          "/api/v1/reports/time_entries": {
            get: {
              summary: "Report on time entries",
              security: [{ bearerAuth: [] }],
              responses: {
                "200": { description: "Time-entry report data" }
              }
            }
          },
          "/mcp": {
            post: {
              summary: "Miru MCP streamable HTTP endpoint",
              security: [{ bearerAuth: [] }],
              responses: {
                "200": { description: "MCP response" },
                "401": { description: "Authentication required" }
              }
            }
          }
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer"
            }
          }
        }
      }
    end
end
