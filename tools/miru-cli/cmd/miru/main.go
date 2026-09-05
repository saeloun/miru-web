package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"golang.org/x/term"
)

const version = "0.3.0"

type client struct {
	baseURL string
	token   string
}

type config struct {
	BaseURL string `json:"base_url"`
	Token   string `json:"token"`
}

type importOptions struct {
	filePath          string
	dryRun            bool
	userMap           []string
	assignUnmatchedTo string
}

type importResponse struct {
	ID           int              `json:"id"`
	Status       string           `json:"status"`
	DryRun       bool             `json:"dry_run"`
	TotalRows    int              `json:"total_rows"`
	ImportedRows int              `json:"imported_rows"`
	FailedRows   int              `json:"failed_rows"`
	Summary      importSummary    `json:"summary"`
	RowErrors    []importRowError `json:"row_errors"`
	ErrorMessage string           `json:"error_message"`
}

type importSummary struct {
	Rows              int `json:"rows"`
	EntriesToCreate   int `json:"entries_to_create"`
	EntriesCreated    int `json:"entries_created"`
	EntriesFailed     int `json:"entries_failed"`
	DuplicatesSkipped int `json:"duplicates_skipped"`
	ZeroHourSkipped   int `json:"zero_hour_skipped"`
	Clients           struct {
		Existing []string `json:"existing"`
		ToCreate []string `json:"to_create"`
	} `json:"clients"`
	Projects struct {
		Existing []string `json:"existing"`
		ToCreate []string `json:"to_create"`
	} `json:"projects"`
	Users struct {
		Matched   map[string]string `json:"matched"`
		Unmatched []string          `json:"unmatched"`
	} `json:"users"`
	DateRange struct {
		From string `json:"from"`
		To   string `json:"to"`
	} `json:"date_range"`
	Warnings []string `json:"warnings"`
}

type importRowError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

var importPollInterval = 2 * time.Second

func main() {
	args := os.Args[1:]
	if len(args) == 0 || args[0] == "help" || args[0] == "--help" || args[0] == "-h" {
		printHelp()
		return
	}

	switch args[0] {
	case "login":
		if err := login(args[1:]); err != nil {
			fail(err)
		}
		return
	case "logout":
		if err := logout(); err != nil {
			fail(err)
		}
		return
	case "whoami":
		cli, err := newClient()
		if err != nil {
			fail(err)
		}
		if err := cli.whoami(); err != nil {
			fail(err)
		}
		return
	case "config":
		if err := manageConfig(args[1:]); err != nil {
			fail(err)
		}
		return
	case "version":
		printVersion()
		return
	}

	cli, err := newClient()
	if err != nil {
		fail(err)
	}

	switch args[0] {
	case "capabilities":
		err = cli.capabilities()
	case "client":
		err = cli.clients(args[1:])
	case "project":
		err = cli.projects(args[1:])
	case "expense":
		err = cli.expenses(args[1:])
	case "invoice", "invoices":
		err = cli.invoices(args[1:])
	case "import":
		err = cli.imports(args[1:])
	case "payment":
		err = cli.payments(args[1:])
	case "time":
		err = cli.timeEntries(args[1:])
	default:
		err = fmt.Errorf("unknown command: %s", strings.Join(args, " "))
	}

	if err != nil {
		fail(err)
	}
}

func newClient() (*client, error) {
	baseURL := strings.TrimSpace(os.Getenv("MIRU_BASE_URL"))
	token := strings.TrimSpace(os.Getenv("MIRU_TOKEN"))

	storedConfig, _ := loadConfig()
	if baseURL == "" {
		baseURL = storedConfig.BaseURL
	}
	if token == "" {
		token = storedConfig.Token
	}
	if baseURL == "" {
		baseURL = "https://app.miru.so"
	}
	baseURL, err := validateBaseURL(baseURL)
	if err != nil {
		return nil, err
	}

	missing := make([]string, 0, 1)
	if token == "" {
		missing = append(missing, "run `miru login`")
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("missing CLI credentials: %s", strings.Join(missing, ", "))
	}

	return &client{
		baseURL: baseURL,
		token:   token,
	}, nil
}

func login(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	baseURL, err := validateBaseURL(defaultString(flags["base-url"], "https://app.miru.so"))
	if err != nil {
		return err
	}
	email := strings.TrimSpace(flags["email"])
	if flags["password"] != "" {
		return fmt.Errorf("--password is not supported because it exposes credentials in process arguments")
	}
	fmt.Print("Password: ")
	password, err := readPassword()
	if err != nil {
		return fmt.Errorf("read password: %w", err)
	}

	if email == "" || password == "" {
		return fmt.Errorf("usage: miru login [--base-url <url>] --email <email>")
	}

	body := map[string]any{
		"user": map[string]string{
			"email":    email,
			"password": password,
		},
		"app": "miru-cli",
	}

	responseBody, err := unauthenticatedRequest(http.MethodPost, baseURL+"/api/v1/users/login", body)
	if err != nil {
		return err
	}

	var payload struct {
		User struct {
			Email string `json:"email"`
		} `json:"user"`
		CliSession struct {
			Token     string `json:"token"`
			ExpiresAt string `json:"expires_at"`
		} `json:"cli_session"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return err
	}

	if payload.CliSession.Token == "" {
		return fmt.Errorf("login succeeded but no token was returned")
	}

	if err := saveConfig(config{
		BaseURL: baseURL,
		Token:   payload.CliSession.Token,
	}); err != nil {
		return err
	}

	fmt.Printf("Logged in as %s\n", payload.User.Email)
	fmt.Printf("Session expires at %s\n", payload.CliSession.ExpiresAt)
	return nil
}

func logout() error {
	cli, err := newClient()
	if err == nil {
		_ = cli.delete("/api/v1/cli/session")
	}

	configPath, err := configFilePath()
	if err != nil {
		return err
	}

	if err := os.Remove(configPath); err != nil && !os.IsNotExist(err) {
		return err
	}

	fmt.Println("Miru CLI credentials removed")
	return nil
}

func manageConfig(args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: miru config <show|token|set-base-url> ...")
	}

	switch args[0] {
	case "show":
		stored, err := loadConfig()
		if err != nil {
			return err
		}

		if stored.BaseURL == "" {
			stored.BaseURL = "https://app.miru.so"
		}

		output := map[string]any{
			"base_url":  stored.BaseURL,
			"logged_in": stored.Token != "",
		}

		data, err := json.MarshalIndent(output, "", "  ")
		if err != nil {
			return err
		}

		fmt.Println(string(data))
		return nil
	case "token":
		flags, err := parseFlags(args[1:])
		if err != nil {
			return err
		}

		stored, err := loadConfig()
		if err != nil {
			return err
		}

		token := strings.TrimSpace(stored.Token)
		if token == "" {
			return fmt.Errorf("no CLI token found; run `miru login` first")
		}

		format := defaultString(flags["format"], "raw")
		switch format {
		case "raw":
			fmt.Println(token)
			return nil
		case "shell":
			fmt.Printf("export MIRU_CLI_TOKEN=%q\n", token)
			return nil
		default:
			return fmt.Errorf("usage: miru config token [--format <raw|shell>]")
		}
	case "set-base-url":
		flags, err := parseFlags(args[1:])
		if err != nil {
			return err
		}

		if flags["url"] == "" {
			return fmt.Errorf("usage: miru config set-base-url --url <url>")
		}
		baseURL, err := validateBaseURL(flags["url"])
		if err != nil {
			return err
		}

		stored, _ := loadConfig()
		stored.BaseURL = baseURL
		if err := saveConfig(stored); err != nil {
			return err
		}

		fmt.Printf("Base URL set to %s\n", baseURL)
		return nil
	default:
		return fmt.Errorf("usage: miru config <show|token|set-base-url> ...")
	}
}

func printVersion() {
	fmt.Printf("miru %s\n", version)
}

func (c *client) whoami() error {
	return c.get("/api/v1/users/_me", nil)
}

func (c *client) capabilities() error {
	return c.get("/api/v1/cli/capabilities", nil)
}

func (c *client) projects(args []string) error {
	if len(args) == 0 || args[0] != "list" {
		return fmt.Errorf("usage: miru project list [--search <term>]")
	}

	values := url.Values{}
	for index := 1; index < len(args); index++ {
		if args[index] == "--search" && index+1 < len(args) {
			values.Set("search_term", args[index+1])
			index++
		}
	}

	path := "/api/v1/projects"
	if encoded := values.Encode(); encoded != "" {
		path = path + "?" + encoded
	}

	return c.get(path, nil)
}

func (c *client) clients(args []string) error {
	if len(args) == 0 || args[0] != "list" {
		return fmt.Errorf("usage: miru client list [--query <term>]")
	}

	values := url.Values{}
	for index := 1; index < len(args); index++ {
		if args[index] == "--query" && index+1 < len(args) {
			values.Set("query", args[index+1])
			index++
			continue
		}

		return fmt.Errorf("unknown flag: %s", args[index])
	}

	path := "/api/v1/cli/clients"
	if encoded := values.Encode(); encoded != "" {
		path = path + "?" + encoded
	}

	return c.get(path, nil)
}

func (c *client) timeEntries(args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: miru time <list|create|update|delete> ...")
	}

	switch args[0] {
	case "list":
		return c.listTimeEntries(args[1:])
	case "create":
		return c.createTimeEntry(args[1:])
	case "update":
		return c.updateTimeEntry(args[1:])
	case "delete":
		return c.deleteTimeEntry(args[1:])
	default:
		return fmt.Errorf("unknown command: miru time %s", strings.Join(args, " "))
	}
}

func (c *client) invoices(args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: miru invoice <list|create|show|send> ...")
	}

	switch args[0] {
	case "list":
		return c.listInvoices(args[1:])
	case "create":
		return c.createInvoice(args[1:])
	case "show":
		return c.showInvoice(args[1:])
	case "send":
		return c.sendInvoice(args[1:])
	default:
		return fmt.Errorf("unknown command: miru invoice %s", strings.Join(args, " "))
	}
}

func (c *client) payments(args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: miru payment <list|show> ...")
	}

	switch args[0] {
	case "list":
		return c.listPayments(args[1:])
	case "show":
		return c.showPayment(args[1:])
	default:
		return fmt.Errorf("unknown command: miru payment %s", strings.Join(args, " "))
	}
}

func (c *client) expenses(args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: miru expense <list|create> ...")
	}

	switch args[0] {
	case "list":
		return c.listExpenses(args[1:])
	case "create":
		return c.createExpense(args[1:])
	default:
		return fmt.Errorf("unknown command: miru expense %s", strings.Join(args, " "))
	}
}

func (c *client) imports(args []string) error {
	if len(args) > 0 && args[0] == "status" {
		return c.importStatus(args[1:])
	}

	options, err := parseImportOptions(args)
	if err != nil {
		return err
	}

	fields := map[string][]string{
		"source":     {"harvest"},
		"kind":       {"time_entries"},
		"dry_run":    {strconv.FormatBool(options.dryRun)},
		"user_map[]": options.userMap,
	}
	if options.assignUnmatchedTo != "" {
		fields["assign_unmatched_to"] = []string{options.assignUnmatchedTo}
	}

	responseBody, err := c.doMultipartRequest(http.MethodPost, "/api/v1/imports", options.filePath, fields)
	if err != nil {
		return err
	}
	dataImport, err := decodeImport(responseBody)
	if err != nil {
		return err
	}

	if options.dryRun {
		fmt.Printf("Dry run #%d started\n", dataImport.ID)
		fmt.Println("Planning...")
	} else {
		fmt.Printf("Import #%d started\n", dataImport.ID)
	}

	for {
		time.Sleep(importPollInterval)
		dataImport, err = c.fetchImport(dataImport.ID)
		if err != nil {
			return err
		}
		if !options.dryRun {
			fmt.Printf("Imported %d/%d (%d failed)\n", dataImport.ImportedRows, dataImport.TotalRows, dataImport.FailedRows)
		}
		switch dataImport.Status {
		case "completed":
			renderImportSummary(dataImport)
			if options.dryRun && (len(dataImport.Summary.Users.Unmatched) > 0 || len(dataImport.RowErrors) > 0) {
				return fmt.Errorf("dry run has unmatched users or row errors")
			}
			if dataImport.FailedRows > 0 {
				return fmt.Errorf("import completed with %d failed rows", dataImport.FailedRows)
			}
			return nil
		case "failed":
			return errors.New(defaultString(dataImport.ErrorMessage, "import failed"))
		}
	}
}

func parseImportOptions(args []string) (importOptions, error) {
	normalized := make([]string, 0, len(args)+1)
	for index := 0; index < len(args); index++ {
		normalized = append(normalized, args[index])
		if args[index] == "--dry-run" && (index+1 >= len(args) || strings.HasPrefix(args[index+1], "--")) {
			normalized = append(normalized, "true")
		}
	}

	flags, err := parseRepeatedFlags(normalized)
	if err != nil {
		return importOptions{}, err
	}
	if err := validateAllowedFlags(flags, map[string]bool{
		"assign-unmatched-to": true,
		"dry-run":             true,
		"file":                true,
		"format":              true,
		"map":                 true,
		"type":                true,
	}); err != nil {
		return importOptions{}, err
	}

	if flagValue(flags, "format") != "harvest" {
		return importOptions{}, fmt.Errorf("format must be harvest")
	}
	importType := defaultString(flagValue(flags, "type"), "time")
	if importType == "expenses" {
		return importOptions{}, fmt.Errorf("expenses import is not supported yet")
	}
	if importType != "time" {
		return importOptions{}, fmt.Errorf("type must be time")
	}

	filePath := strings.TrimSpace(flagValue(flags, "file"))
	file, err := os.Open(filePath)
	if err != nil {
		return importOptions{}, fmt.Errorf("file must exist and be readable: %w", err)
	}
	info, err := file.Stat()
	file.Close()
	if err != nil || !info.Mode().IsRegular() {
		return importOptions{}, fmt.Errorf("file must exist and be readable")
	}

	dryRun := false
	if value := flagValue(flags, "dry-run"); value != "" {
		dryRun, err = strconv.ParseBool(value)
		if err != nil {
			return importOptions{}, fmt.Errorf("dry-run must be true or false")
		}
	}

	return importOptions{
		filePath:          filePath,
		dryRun:            dryRun,
		userMap:           flags["map"],
		assignUnmatchedTo: strings.TrimSpace(flagValue(flags, "assign-unmatched-to")),
	}, nil
}

func (c *client) importStatus(args []string) error {
	flags, err := parseRepeatedFlags(args)
	if err != nil {
		return err
	}
	if err := validateAllowedFlags(flags, map[string]bool{"id": true}); err != nil {
		return err
	}
	id, err := positiveIntFlag(flags, "id")
	if err != nil {
		return err
	}

	dataImport, err := c.fetchImport(id)
	if err != nil {
		return err
	}
	renderImportSummary(dataImport)
	if dataImport.Status == "failed" {
		return errors.New(defaultString(dataImport.ErrorMessage, "import failed"))
	}
	return nil
}

func (c *client) fetchImport(id int) (importResponse, error) {
	responseBody, err := c.doRequest(http.MethodGet, fmt.Sprintf("/api/v1/imports/%d", id), nil)
	if err != nil {
		return importResponse{}, err
	}
	return decodeImport(responseBody)
}

func decodeImport(responseBody []byte) (importResponse, error) {
	var dataImport importResponse
	if err := json.Unmarshal(responseBody, &dataImport); err != nil {
		return importResponse{}, err
	}
	return dataImport, nil
}

func renderImportSummary(dataImport importResponse) {
	summary := dataImport.Summary
	fmt.Printf("Rows: %d\n", summary.Rows)
	fmt.Printf("Date range: %s to %s\n", summary.DateRange.From, summary.DateRange.To)
	fmt.Printf("Clients existing: %s\n", listOrNone(summary.Clients.Existing))
	fmt.Printf("Clients to create: %s\n", listOrNone(summary.Clients.ToCreate))
	fmt.Printf("Projects existing: %s\n", listOrNone(summary.Projects.Existing))
	fmt.Printf("Projects to create: %s\n", listOrNone(summary.Projects.ToCreate))

	names := make([]string, 0, len(summary.Users.Matched))
	for name := range summary.Users.Matched {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		fmt.Printf("Team member: %s -> %s\n", name, summary.Users.Matched[name])
	}
	for _, name := range summary.Users.Unmatched {
		fmt.Printf("Unmatched team member: %s\n", name)
	}
	if len(summary.Users.Unmatched) > 0 {
		fmt.Println("Map unmatched users with --map \"First Last=email\"")
	}

	if dataImport.DryRun {
		fmt.Printf("Entries to create: %d\n", summary.EntriesToCreate)
	} else if dataImport.Status == "completed" {
		fmt.Printf("Entries created: %d\n", summary.EntriesCreated)
		fmt.Printf("Entries failed: %d\n", summary.EntriesFailed)
	}
	fmt.Printf("Duplicates skipped: %d\n", summary.DuplicatesSkipped)
	fmt.Printf("Zero-hour rows skipped: %d\n", summary.ZeroHourSkipped)
	for index, rowError := range dataImport.RowErrors {
		if index == 20 {
			break
		}
		fmt.Printf("Row %d: %s\n", rowError.Row, rowError.Message)
	}
	for _, warning := range summary.Warnings {
		fmt.Printf("Warning: %s\n", warning)
	}
}

func listOrNone(values []string) string {
	if len(values) == 0 {
		return "none"
	}
	return strings.Join(values, ", ")
}

func (c *client) listTimeEntries(args []string) error {
	values := url.Values{}

	for index := 0; index < len(args); index++ {
		switch args[index] {
		case "--from":
			index++
			if index >= len(args) {
				return fmt.Errorf("missing value for --from")
			}
			values.Set("from", args[index])
		case "--to":
			index++
			if index >= len(args) {
				return fmt.Errorf("missing value for --to")
			}
			values.Set("to", args[index])
		default:
			return fmt.Errorf("unknown flag: %s", args[index])
		}
	}

	if values.Get("from") == "" || values.Get("to") == "" {
		return fmt.Errorf("usage: miru time list --from <YYYY-MM-DD> --to <YYYY-MM-DD>")
	}

	return c.get("/api/v1/timesheet_entry?"+values.Encode(), nil)
}

func (c *client) createTimeEntry(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	projectID, err := strconv.Atoi(flags["project-id"])
	if err != nil || projectID <= 0 {
		return fmt.Errorf("project-id must be a positive integer")
	}

	duration, err := strconv.ParseFloat(flags["duration"], 64)
	if err != nil || duration <= 0 {
		return fmt.Errorf("duration must be a positive number")
	}

	workDate := flags["date"]
	if workDate == "" {
		return fmt.Errorf("date is required")
	}

	body := map[string]any{
		"timesheet_entry": map[string]any{
			"project_id":       projectID,
			"duration_minutes": duration,
			"work_date":        workDate,
			"note":             flags["note"],
			"bill_status":      defaultString(flags["bill-status"], "unbilled"),
		},
	}

	return c.post("/api/v1/cli/timesheet_entries", body)
}

func (c *client) updateTimeEntry(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	id := strings.TrimSpace(flags["id"])
	if id == "" {
		return fmt.Errorf("usage: miru time update --id <id> --project-id <id> --duration <minutes> --date <YYYY-MM-DD> [--note <text>] [--bill-status <status>]")
	}

	projectID, err := strconv.Atoi(flags["project-id"])
	if err != nil || projectID <= 0 {
		return fmt.Errorf("project-id must be a positive integer")
	}

	duration, err := strconv.ParseFloat(flags["duration"], 64)
	if err != nil || duration <= 0 {
		return fmt.Errorf("duration must be a positive number")
	}

	workDate := flags["date"]
	if workDate == "" {
		return fmt.Errorf("date is required")
	}

	body := map[string]any{
		"timesheet_entry": map[string]any{
			"project_id":       projectID,
			"duration_minutes": duration,
			"work_date":        workDate,
			"note":             flags["note"],
			"bill_status":      defaultString(flags["bill-status"], "unbilled"),
		},
	}

	return c.patch("/api/v1/cli/timesheet_entries/"+id, body)
}

func (c *client) deleteTimeEntry(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	id := strings.TrimSpace(flags["id"])
	if id == "" {
		return fmt.Errorf("usage: miru time delete --id <id>")
	}

	return c.delete("/api/v1/cli/timesheet_entries/" + id)
}

func (c *client) listInvoices(args []string) error {
	values := url.Values{}

	for index := 0; index < len(args); index++ {
		switch args[index] {
		case "--query":
			index++
			if index >= len(args) {
				return fmt.Errorf("missing value for --query")
			}
			values.Set("query", args[index])
		case "--page":
			index++
			if index >= len(args) {
				return fmt.Errorf("missing value for --page")
			}
			values.Set("page", args[index])
		case "--per":
			index++
			if index >= len(args) {
				return fmt.Errorf("missing value for --per")
			}
			values.Set("per", args[index])
		case "--status":
			index++
			if index >= len(args) {
				return fmt.Errorf("missing value for --status")
			}
			values.Set("status", args[index])
		default:
			return fmt.Errorf("unknown flag: %s", args[index])
		}
	}

	path := "/api/v1/invoices"
	if encoded := values.Encode(); encoded != "" {
		path = path + "?" + encoded
	}

	return c.get(path, nil)
}

func (c *client) showInvoice(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	id := flags["id"]
	if id == "" {
		return fmt.Errorf("usage: miru invoice show --id <id>")
	}

	return c.get("/api/v1/invoices/"+id, nil)
}

func (c *client) createInvoice(args []string) error {
	body, err := buildCreateInvoiceBody(args)
	if err != nil {
		return err
	}

	return c.post("/api/v1/invoices", body)
}

func buildCreateInvoiceBody(args []string) (map[string]any, error) {
	flags, err := parseRepeatedFlags(args)
	if err != nil {
		return nil, err
	}
	if err := validateAllowedFlags(flags, map[string]bool{
		"amount-paid":          true,
		"client-id":            true,
		"currency":             true,
		"discount":             true,
		"due-date":             true,
		"invoice-number":       true,
		"issue-date":           true,
		"line-item":            true,
		"line-items-json":      true,
		"payload-file":         true,
		"reference":            true,
		"status":               true,
		"stripe-enabled":       true,
		"tax":                  true,
		"tax-configuration-id": true,
	}); err != nil {
		return nil, err
	}

	if payloadFile := flagValue(flags, "payload-file"); payloadFile != "" {
		return readInvoicePayloadFile(payloadFile)
	}

	clientID, err := positiveIntFlag(flags, "client-id")
	if err != nil {
		return nil, err
	}

	invoiceNumber := strings.TrimSpace(flagValue(flags, "invoice-number"))
	issueDate := strings.TrimSpace(flagValue(flags, "issue-date"))
	dueDate := strings.TrimSpace(flagValue(flags, "due-date"))
	if invoiceNumber == "" || issueDate == "" || dueDate == "" {
		return nil, fmt.Errorf("usage: miru invoice create --client-id <id> --invoice-number <number> --issue-date <YYYY-MM-DD> --due-date <YYYY-MM-DD> --line-item <name|description|YYYY-MM-DD|rate|minutes>")
	}
	if err := validateDateFlag("issue-date", issueDate); err != nil {
		return nil, err
	}
	if err := validateDateFlag("due-date", dueDate); err != nil {
		return nil, err
	}

	lineItems, err := invoiceLineItems(flags)
	if err != nil {
		return nil, err
	}

	invoice := map[string]any{
		"client_id":                     clientID,
		"invoice_number":                invoiceNumber,
		"issue_date":                    issueDate,
		"due_date":                      dueDate,
		"status":                        defaultString(flagValue(flags, "status"), "draft"),
		"invoice_line_items_attributes": lineItems,
	}

	for _, option := range []string{"currency", "reference"} {
		if value := strings.TrimSpace(flagValue(flags, option)); value != "" {
			invoice[strings.ReplaceAll(option, "-", "_")] = value
		}
	}

	for _, option := range []string{"discount", "tax", "amount-paid"} {
		if err := setNonNegativeFloatFlag(invoice, flags, option); err != nil {
			return nil, err
		}
	}

	if stripeEnabled := strings.TrimSpace(flagValue(flags, "stripe-enabled")); stripeEnabled != "" {
		enabled, err := strconv.ParseBool(stripeEnabled)
		if err != nil {
			return nil, fmt.Errorf("stripe-enabled must be true or false")
		}
		invoice["stripe_enabled"] = enabled
	}

	if taxConfigurationIDs := flags["tax-configuration-id"]; len(taxConfigurationIDs) > 0 {
		invoiceTaxes := make([]map[string]any, 0, len(taxConfigurationIDs))
		for _, value := range taxConfigurationIDs {
			id, err := parsePositiveInt("tax-configuration-id", value)
			if err != nil {
				return nil, err
			}
			invoiceTaxes = append(invoiceTaxes, map[string]any{"tax_configuration_id": id})
		}
		invoice["invoice_taxes_attributes"] = invoiceTaxes
	}

	return map[string]any{"invoice": invoice}, nil
}

func readInvoicePayloadFile(path string) (map[string]any, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var body map[string]any
	if err := json.Unmarshal(data, &body); err != nil {
		return nil, fmt.Errorf("payload-file must contain valid JSON: %w", err)
	}
	if _, ok := body["invoice"]; ok {
		return body, nil
	}

	return map[string]any{"invoice": body}, nil
}

func invoiceLineItems(flags map[string][]string) ([]map[string]any, error) {
	if lineItemsJSON := strings.TrimSpace(flagValue(flags, "line-items-json")); lineItemsJSON != "" {
		var lineItems []map[string]any
		if err := json.Unmarshal([]byte(lineItemsJSON), &lineItems); err != nil {
			return nil, fmt.Errorf("line-items-json must be a JSON array: %w", err)
		}
		if len(lineItems) == 0 {
			return nil, fmt.Errorf("at least one invoice line item is required")
		}
		return lineItems, nil
	}

	values := flags["line-item"]
	if len(values) == 0 {
		return nil, fmt.Errorf("at least one --line-item or --line-items-json value is required")
	}

	lineItems := make([]map[string]any, 0, len(values))
	for _, value := range values {
		lineItem, err := parseInvoiceLineItem(value)
		if err != nil {
			return nil, err
		}
		lineItems = append(lineItems, lineItem)
	}

	return lineItems, nil
}

func parseInvoiceLineItem(value string) (map[string]any, error) {
	parts := strings.Split(value, "|")
	if len(parts) != 5 {
		return nil, fmt.Errorf("line-item must be <name|description|YYYY-MM-DD|rate|minutes>")
	}

	name := strings.TrimSpace(parts[0])
	description := strings.TrimSpace(parts[1])
	date := strings.TrimSpace(parts[2])
	if name == "" {
		return nil, fmt.Errorf("line-item name is required")
	}
	if err := validateDateFlag("line-item date", date); err != nil {
		return nil, err
	}

	rate, err := parseNonNegativeFloat("line-item rate", parts[3])
	if err != nil {
		return nil, err
	}

	quantity, err := parseNonNegativeFloat("line-item minutes", parts[4])
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"name":        name,
		"description": description,
		"date":        date,
		"rate":        rate,
		"quantity":    quantity,
	}, nil
}

func (c *client) sendInvoice(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	id := strings.TrimSpace(flags["id"])
	recipientsFlag := strings.TrimSpace(flags["recipients"])
	if id == "" || recipientsFlag == "" {
		return fmt.Errorf("usage: miru invoice send --id <id> --recipients <email1,email2> [--subject <text>] [--message <text>]")
	}

	recipients := make([]string, 0)
	for _, recipient := range strings.Split(recipientsFlag, ",") {
		recipient = strings.TrimSpace(recipient)
		if recipient != "" {
			recipients = append(recipients, recipient)
		}
	}
	if len(recipients) == 0 {
		return fmt.Errorf("at least one recipient is required")
	}

	body := map[string]any{
		"invoice_email": map[string]any{
			"recipients": recipients,
			"subject":    flags["subject"],
			"message":    flags["message"],
		},
	}

	return c.post("/api/v1/invoices/"+id+"/send_invoice", body)
}

func (c *client) listPayments(args []string) error {
	values := url.Values{}

	for index := 0; index < len(args); index++ {
		switch args[index] {
		case "--query":
			index++
			if index >= len(args) {
				return fmt.Errorf("missing value for --query")
			}
			values.Set("query", args[index])
		default:
			return fmt.Errorf("unknown flag: %s", args[index])
		}
	}

	path := "/api/v1/payments"
	if encoded := values.Encode(); encoded != "" {
		path = path + "?" + encoded
	}

	return c.get(path, nil)
}

func (c *client) showPayment(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	id := flags["id"]
	if id == "" {
		return fmt.Errorf("usage: miru payment show --id <id>")
	}

	return c.get("/api/v1/payments/"+id, nil)
}

func (c *client) listExpenses(args []string) error {
	values := url.Values{}

	for index := 0; index < len(args); index++ {
		switch args[index] {
		case "--query":
			index++
			if index >= len(args) {
				return fmt.Errorf("missing value for --query")
			}
			values.Set("query", args[index])
		default:
			return fmt.Errorf("unknown flag: %s", args[index])
		}
	}

	path := "/api/v1/cli/expenses"
	if encoded := values.Encode(); encoded != "" {
		path = path + "?" + encoded
	}

	return c.get(path, nil)
}

func (c *client) createExpense(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	amount, err := strconv.ParseFloat(flags["amount"], 64)
	if err != nil || amount <= 0 {
		return fmt.Errorf("amount must be a positive number")
	}

	date := strings.TrimSpace(flags["date"])
	if date == "" {
		return fmt.Errorf("date is required")
	}

	expenseType := defaultString(flags["type"], "business")
	if expenseType != "business" && expenseType != "personal" {
		return fmt.Errorf("type must be either business or personal")
	}

	categoryName := strings.TrimSpace(flags["category"])
	if categoryName == "" {
		return fmt.Errorf("category is required")
	}

	body := map[string]any{
		"expense": map[string]any{
			"amount":        amount,
			"date":          date,
			"description":   flags["description"],
			"expense_type":  expenseType,
			"category_name": categoryName,
		},
	}

	if vendorName := strings.TrimSpace(flags["vendor"]); vendorName != "" {
		body["expense"].(map[string]any)["vendor_name"] = vendorName
	}

	return c.post("/api/v1/cli/expenses", body)
}

func (c *client) get(path string, body map[string]any) error {
	return c.request(http.MethodGet, path, body)
}

func (c *client) post(path string, body map[string]any) error {
	return c.request(http.MethodPost, path, body)
}

func (c *client) patch(path string, body map[string]any) error {
	return c.request(http.MethodPatch, path, body)
}

func (c *client) delete(path string) error {
	return c.request(http.MethodDelete, path, nil)
}

func (c *client) request(method, path string, body map[string]any) error {
	responseBody, err := c.doRequest(method, path, body)
	if err != nil {
		return err
	}

	var formatted bytes.Buffer
	if err := json.Indent(&formatted, responseBody, "", "  "); err == nil {
		fmt.Println(formatted.String())
		return nil
	}

	fmt.Println(string(responseBody))
	return nil
}

func (c *client) doRequest(method, path string, body map[string]any) ([]byte, error) {
	var payload io.Reader

	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		payload = bytes.NewReader(encoded)
	}

	req, err := http.NewRequest(method, c.baseURL+path, payload)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.token)

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	if response.StatusCode >= http.StatusBadRequest {
		return nil, parseError(response.StatusCode, responseBody)
	}

	return responseBody, nil
}

func (c *client) doMultipartRequest(method, path, filePath string, fields map[string][]string) ([]byte, error) {
	var payload bytes.Buffer
	writer := multipart.NewWriter(&payload)
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(part, file); err != nil {
		return nil, err
	}
	for name, values := range fields {
		for _, value := range values {
			if err := writer.WriteField(name, value); err != nil {
				return nil, err
			}
		}
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequest(method, c.baseURL+path, &payload)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+c.token)

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	if response.StatusCode >= http.StatusBadRequest {
		return nil, parseError(response.StatusCode, responseBody)
	}
	return responseBody, nil
}

func parseError(statusCode int, responseBody []byte) error {
	var payload map[string]any
	if err := json.Unmarshal(responseBody, &payload); err == nil {
		for _, key := range []string{"error", "errors", "message", "notice"} {
			if message := stringifyErrorValue(payload[key]); message != "" {
				return errors.New(message)
			}
		}
	}

	body := strings.TrimSpace(string(responseBody))
	if body != "" {
		return fmt.Errorf("request failed with status %d: %s", statusCode, body)
	}

	return fmt.Errorf("request failed with status %d", statusCode)
}

func stringifyErrorValue(value any) string {
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed)
	case []any:
		parts := make([]string, 0, len(typed))
		for _, item := range typed {
			if part := stringifyErrorValue(item); part != "" {
				parts = append(parts, part)
			}
		}
		return strings.Join(parts, ", ")
	case map[string]any:
		parts := make([]string, 0, len(typed))
		for _, item := range typed {
			if part := stringifyErrorValue(item); part != "" {
				parts = append(parts, part)
			}
		}
		return strings.Join(parts, ", ")
	default:
		return ""
	}
}

func parseFlags(args []string) (map[string]string, error) {
	flags := map[string]string{}

	for index := 0; index < len(args); index++ {
		if !strings.HasPrefix(args[index], "--") {
			return nil, fmt.Errorf("unknown argument: %s", args[index])
		}

		key := strings.TrimPrefix(args[index], "--")
		index++
		if index >= len(args) {
			return nil, fmt.Errorf("missing value for --%s", key)
		}
		flags[key] = args[index]
	}

	return flags, nil
}

func parseRepeatedFlags(args []string) (map[string][]string, error) {
	flags := map[string][]string{}

	for index := 0; index < len(args); index++ {
		if !strings.HasPrefix(args[index], "--") {
			return nil, fmt.Errorf("unknown argument: %s", args[index])
		}

		key := strings.TrimPrefix(args[index], "--")
		index++
		if index >= len(args) {
			return nil, fmt.Errorf("missing value for --%s", key)
		}
		flags[key] = append(flags[key], args[index])
	}

	return flags, nil
}

func validateAllowedFlags(flags map[string][]string, allowed map[string]bool) error {
	for flag := range flags {
		if !allowed[flag] {
			return fmt.Errorf("unknown flag: --%s", flag)
		}
	}

	return nil
}

func flagValue(flags map[string][]string, name string) string {
	values := flags[name]
	if len(values) == 0 {
		return ""
	}

	return values[len(values)-1]
}

func positiveIntFlag(flags map[string][]string, name string) (int, error) {
	value := strings.TrimSpace(flagValue(flags, name))
	if value == "" {
		return 0, fmt.Errorf("%s is required", name)
	}

	return parsePositiveInt(name, value)
}

func parsePositiveInt(name, value string) (int, error) {
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil || parsed <= 0 {
		return 0, fmt.Errorf("%s must be a positive integer", name)
	}

	return parsed, nil
}

func setNonNegativeFloatFlag(target map[string]any, flags map[string][]string, name string) error {
	value := strings.TrimSpace(flagValue(flags, name))
	if value == "" {
		return nil
	}

	parsed, err := parseNonNegativeFloat(name, value)
	if err != nil {
		return err
	}

	target[strings.ReplaceAll(name, "-", "_")] = parsed
	return nil
}

func parseNonNegativeFloat(name, value string) (float64, error) {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
	if err != nil || parsed < 0 {
		return 0, fmt.Errorf("%s must be a non-negative number", name)
	}

	return parsed, nil
}

func validateDateFlag(name, value string) error {
	if _, err := time.Parse("2006-01-02", value); err != nil {
		return fmt.Errorf("%s must use YYYY-MM-DD", name)
	}

	return nil
}

func unauthenticatedRequest(method, target string, body map[string]any) ([]byte, error) {
	var payload io.Reader

	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		payload = bytes.NewReader(encoded)
	}

	req, err := http.NewRequest(method, target, payload)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	if response.StatusCode >= http.StatusBadRequest {
		return nil, parseError(response.StatusCode, responseBody)
	}

	return responseBody, nil
}

func defaultString(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}

	return value
}

func validateBaseURL(raw string) (string, error) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || parsed.Host == "" || parsed.Scheme == "" || parsed.User != nil ||
		parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", fmt.Errorf("base URL must be an HTTPS URL, or HTTP on loopback")
	}

	parsed.Scheme = strings.ToLower(parsed.Scheme)
	if parsed.Scheme == "http" {
		host := parsed.Hostname()
		ip := net.ParseIP(host)
		if host != "localhost" && (ip == nil || !ip.IsLoopback()) {
			return "", fmt.Errorf("base URL must use HTTPS outside loopback")
		}
	} else if parsed.Scheme != "https" {
		return "", fmt.Errorf("base URL must be an HTTPS URL, or HTTP on loopback")
	}

	return strings.TrimRight(parsed.String(), "/"), nil
}

func readPassword() (string, error) {
	if term.IsTerminal(int(os.Stdin.Fd())) {
		password, err := term.ReadPassword(int(os.Stdin.Fd()))
		fmt.Println()
		return strings.TrimSpace(string(password)), err
	}

	password, err := bufio.NewReader(os.Stdin).ReadString('\n')
	if err != nil && !errors.Is(err, io.EOF) {
		return "", err
	}
	return strings.TrimSpace(password), nil
}

func printHelp() {
	fmt.Println(`miru login [--base-url <url>] --email <email>
miru logout
miru whoami
miru config show
miru config token [--format <raw|shell>]
miru config set-base-url --url <url>
miru version
miru capabilities
miru client list [--query <term>]
miru project list [--search <term>]
miru expense list [--query <term>]
miru expense create --amount <amount> --date <YYYY-MM-DD> --category <name> [--vendor <name>] [--description <text>] [--type <business|personal>]
miru invoice list [--query <term>] [--page <page>] [--per <count>] [--status <status>]
miru invoice create --client-id <id> --invoice-number <number> --issue-date <YYYY-MM-DD> --due-date <YYYY-MM-DD> --line-item <name|description|YYYY-MM-DD|rate|minutes>
miru invoice show --id <id>
miru invoice send --id <id> --recipients <email1,email2> [--subject <text>] [--message <text>]
miru payment list [--query <term>]
miru payment show --id <id>
miru import --file <path> --format harvest [--type time] [--dry-run] [--map "First Last=email"]... [--assign-unmatched-to <email>]
miru import status --id <id>
miru time list --from <YYYY-MM-DD> --to <YYYY-MM-DD>
miru time create --project-id <id> --duration <minutes> --date <YYYY-MM-DD> [--note <text>] [--bill-status <status>]
miru time update --id <id> --project-id <id> --duration <minutes> --date <YYYY-MM-DD> [--note <text>] [--bill-status <status>]
miru time delete --id <id>`)
}

func loadConfig() (config, error) {
	configPath, err := configFilePath()
	if err != nil {
		return config{}, err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return config{}, err
	}

	var stored config
	if err := json.Unmarshal(data, &stored); err != nil {
		return config{}, err
	}

	return stored, nil
}

func saveConfig(stored config) error {
	configPath, err := configFilePath()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(configPath), 0o700); err != nil {
		return err
	}

	data, err := json.MarshalIndent(stored, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, append(data, '\n'), 0o600)
}

func configFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(homeDir, ".config", "miru", "config.json"), nil
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, err.Error())
	os.Exit(1)
}
