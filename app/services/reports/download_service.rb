class Reports::DownloadService
  attr_reader :params, :current_company

  def initialize(params, current_company)
    @params = params
    @current_company = current_company
  end

  def process
    fetch_complete_report
    format_report
  end

  private

  def fetch_complete_report
    raise NotImplementedError, "Subclasses must implement a 'fetch_complete_report' method."
  end

  def format_report
    if params[:format] == "pdf"
      generate_pdf
    else
      generate_csv
    end
  end

  def generate_pdf
    raise NotImplementedError, "Implement generate_pdf in the inheriting class"
  end

  def generate_csv
    raise NotImplementedError, "Implement generate_csv in the inheriting class"
  end
end
