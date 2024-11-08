# frozen_string_literal: true

class Pdf::HtmlGenerator
  attr_accessor :template, :layout, :locals, :root_url

  def initialize(template, layout: "layouts/pdf", locals: {}, options: {}, path: nil, root_url: nil)
    # all HTML template files must be stored inside app/views/pdfs folder
    @template = "pdfs/#{template}"
    @layout = layout
    @locals = locals
    @path = path
    @root_url = root_url

    set_options(options)
  end

  def make
    Grover.new(make_html, **@options).to_pdf
  end

  private

    def set_options(user_defined_options)
      if user_defined_options.present?
        @options = user_defined_options
      else
        @options = {
          wait_until: ["load", "domcontentloaded"]
        }
      end

      if @path
        @options[:path] = @path
      end
    end

    def make_html
      html = ActionController::Base.new.render_to_string(
        template:,
        layout:,
        locals:
      )

      if root_url
        Grover::HTMLPreprocessor.process html, "#{root_url}/", "http"
      else
        html
      end
    end
end
