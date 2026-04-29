package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

const version = "0.1.0"

type client struct {
	baseURL string
	token   string
}

type config struct {
	BaseURL string `json:"base_url"`
	Token   string `json:"token"`
}

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
	case "upgrade":
		if err := upgrade(); err != nil {
			fail(err)
		}
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
	case "invoice":
		err = cli.invoices(args[1:])
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

	missing := make([]string, 0, 1)
	if token == "" {
		missing = append(missing, "run `miru login`")
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("missing CLI credentials: %s", strings.Join(missing, ", "))
	}

	return &client{
		baseURL: strings.TrimRight(baseURL, "/"),
		token:   token,
	}, nil
}

func login(args []string) error {
	flags, err := parseFlags(args)
	if err != nil {
		return err
	}

	baseURL := strings.TrimRight(defaultString(flags["base-url"], "https://app.miru.so"), "/")
	email := strings.TrimSpace(flags["email"])
	password := flags["password"]

	if email == "" || password == "" {
		return fmt.Errorf("usage: miru login [--base-url <url>] --email <email> --password <password>")
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

		baseURL := strings.TrimRight(flags["url"], "/")
		if baseURL == "" {
			return fmt.Errorf("usage: miru config set-base-url --url <url>")
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

func upgrade() error {
	if _, err := exec.LookPath("mise"); err != nil {
		return fmt.Errorf("mise is required to upgrade Miru CLI")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	gobinDir := filepath.Join(homeDir, ".local", "bin")
	if err := os.MkdirAll(gobinDir, 0o755); err != nil {
		return err
	}

	command, err := upgradeCommand(gobinDir)
	if err != nil {
		return err
	}
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	command.Stdin = os.Stdin

	if err := command.Run(); err != nil {
		return err
	}

	fmt.Printf("Miru CLI upgraded in %s\n", gobinDir)
	return nil
}

func upgradeCommand(gobinDir string) (*exec.Cmd, error) {
	if repoDir, ok := findLocalCLIRepo(); ok {
		command := exec.Command(
			"mise",
			"exec",
			"go@1.24.1",
			"--",
			"env",
			"GOBIN="+gobinDir,
			"go",
			"install",
			"./cmd/miru",
		)
		command.Dir = repoDir
		return command, nil
	}

	return exec.Command(
		"mise",
		"exec",
		"go@1.24.1",
		"--",
		"env",
		"GOBIN="+gobinDir,
		"go",
		"install",
		"github.com/saeloun/miru-web/tools/miru-cli/cmd/miru@main",
	), nil
}

func findLocalCLIRepo() (string, bool) {
	workingDir, err := os.Getwd()
	if err != nil {
		return "", false
	}

	current := workingDir
	for {
		candidate := filepath.Join(current, "tools", "miru-cli", "go.mod")
		if _, err := os.Stat(candidate); err == nil {
			return filepath.Join(current, "tools", "miru-cli"), true
		}

		parent := filepath.Dir(current)
		if parent == current {
			return "", false
		}
		current = parent
	}
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
		return fmt.Errorf("usage: miru invoice <list|show|send> ...")
	}

	switch args[0] {
	case "list":
		return c.listInvoices(args[1:])
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

func printHelp() {
	fmt.Println(`miru login [--base-url <url>] --email <email> --password <password>
miru logout
miru whoami
miru config show
miru config token [--format <raw|shell>]
miru config set-base-url --url <url>
miru version
miru upgrade
miru capabilities
miru client list [--query <term>]
miru project list [--search <term>]
miru expense list [--query <term>]
miru expense create --amount <amount> --date <YYYY-MM-DD> --category <name> [--vendor <name>] [--description <text>] [--type <business|personal>]
miru invoice list [--query <term>] [--page <page>] [--per <count>] [--status <status>]
miru invoice show --id <id>
miru invoice send --id <id> --recipients <email1,email2> [--subject <text>] [--message <text>]
miru payment list [--query <term>]
miru payment show --id <id>
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
