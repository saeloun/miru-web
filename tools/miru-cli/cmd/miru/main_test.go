package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"sync/atomic"
	"testing"
)

func TestValidateBaseURL(t *testing.T) {
	tests := map[string]bool{
		"https://app.miru.so":     true,
		"http://localhost:3000":   true,
		"http://127.0.0.1:3000":   true,
		"http://[::1]:3000":       true,
		"http://miru.example.com": false,
		"app.miru.so":             false,
		"https://user@miru.so":    false,
		"https://miru.so?q=token": false,
	}

	for raw, valid := range tests {
		_, err := validateBaseURL(raw)
		if valid && err != nil {
			t.Errorf("expected %q to be valid: %v", raw, err)
		}
		if !valid && err == nil {
			t.Errorf("expected %q to be rejected", raw)
		}
	}
}

func TestBuildCreateInvoiceBodyFromFlags(t *testing.T) {
	body, err := buildCreateInvoiceBody([]string{
		"--client-id", "42",
		"--invoice-number", "INV-CLI-001",
		"--issue-date", "2026-05-19",
		"--due-date", "2026-06-18",
		"--currency", "USD",
		"--reference", "PO-123",
		"--discount", "25",
		"--tax-configuration-id", "3",
		"--tax-configuration-id", "4",
		"--line-item", "Implementation|API work|2026-05-19|150|120",
		"--line-item", "QA|Regression pass|2026-05-20|90|60",
	})
	if err != nil {
		t.Fatalf("expected invoice body, got error: %v", err)
	}

	invoice := body["invoice"].(map[string]any)
	if invoice["client_id"] != 42 {
		t.Fatalf("expected client_id 42, got %v", invoice["client_id"])
	}
	if invoice["invoice_number"] != "INV-CLI-001" {
		t.Fatalf("expected invoice number, got %v", invoice["invoice_number"])
	}
	if invoice["status"] != "draft" {
		t.Fatalf("expected draft status, got %v", invoice["status"])
	}
	if invoice["discount"] != 25.0 {
		t.Fatalf("expected discount, got %v", invoice["discount"])
	}

	lineItems := invoice["invoice_line_items_attributes"].([]map[string]any)
	if len(lineItems) != 2 {
		t.Fatalf("expected two line items, got %d", len(lineItems))
	}
	if lineItems[0]["name"] != "Implementation" || lineItems[0]["quantity"] != 120.0 {
		t.Fatalf("unexpected first line item: %#v", lineItems[0])
	}

	invoiceTaxes := invoice["invoice_taxes_attributes"].([]map[string]any)
	if len(invoiceTaxes) != 2 {
		t.Fatalf("expected two invoice taxes, got %d", len(invoiceTaxes))
	}
	if invoiceTaxes[0]["tax_configuration_id"] != 3 || invoiceTaxes[1]["tax_configuration_id"] != 4 {
		t.Fatalf("unexpected tax configuration ids: %#v", invoiceTaxes)
	}
}

func TestBuildCreateInvoiceBodyFromLineItemsJSON(t *testing.T) {
	body, err := buildCreateInvoiceBody([]string{
		"--client-id", "42",
		"--invoice-number", "INV-CLI-002",
		"--issue-date", "2026-05-19",
		"--due-date", "2026-06-18",
		"--line-items-json", `[{"name":"Strategy","description":"Planning","date":"2026-05-19","rate":200,"quantity":30}]`,
	})
	if err != nil {
		t.Fatalf("expected invoice body, got error: %v", err)
	}

	invoice := body["invoice"].(map[string]any)
	lineItems := invoice["invoice_line_items_attributes"].([]map[string]any)
	if lineItems[0]["name"] != "Strategy" {
		t.Fatalf("unexpected line item from JSON: %#v", lineItems[0])
	}
}

func TestBuildCreateInvoiceBodyFromPayloadFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "invoice.json")
	if err := os.WriteFile(path, []byte(`{"client_id":42,"invoice_number":"INV-FILE-001"}`), 0o600); err != nil {
		t.Fatal(err)
	}

	body, err := buildCreateInvoiceBody([]string{"--payload-file", path})
	if err != nil {
		t.Fatalf("expected invoice body, got error: %v", err)
	}

	invoice := body["invoice"].(map[string]any)
	if invoice["invoice_number"] != "INV-FILE-001" {
		t.Fatalf("expected payload file invoice number, got %#v", invoice)
	}
}

func TestBuildCreateInvoiceBodyValidatesLineItemShape(t *testing.T) {
	_, err := buildCreateInvoiceBody([]string{
		"--client-id", "42",
		"--invoice-number", "INV-CLI-003",
		"--issue-date", "2026-05-19",
		"--due-date", "2026-06-18",
		"--line-item", "Implementation|missing fields",
	})
	if err == nil || err.Error() != "line-item must be <name|description|YYYY-MM-DD|rate|minutes>" {
		t.Fatalf("expected line item shape error, got %v", err)
	}
}

func TestParseErrorSupportsStringError(t *testing.T) {
	err := parseError(422, []byte(`{"error":"Recipients are required"}`))
	if err == nil || err.Error() != "Recipients are required" {
		t.Fatalf("expected string error, got %v", err)
	}
}

func TestParseErrorSupportsStringErrors(t *testing.T) {
	err := parseError(403, []byte(`{"errors":"You are not authorized to perform this action."}`))
	if err == nil || err.Error() != "You are not authorized to perform this action." {
		t.Fatalf("expected errors string, got %v", err)
	}
}

func TestParseErrorSupportsArrayErrors(t *testing.T) {
	err := parseError(422, []byte(`{"errors":["first problem","second problem"]}`))
	if err == nil || err.Error() != "first problem, second problem" {
		t.Fatalf("expected joined array errors, got %v", err)
	}
}

func TestParseErrorSupportsObjectErrors(t *testing.T) {
	err := parseError(422, []byte(`{"error":{"email":["is invalid"],"password":["is too short"]}}`))
	if err == nil {
		t.Fatalf("expected object errors to be parsed")
	}
	if err.Error() != "is invalid, is too short" && err.Error() != "is too short, is invalid" {
		t.Fatalf("unexpected parsed error: %v", err)
	}
}

func TestParseErrorFallsBackToStatusAndBody(t *testing.T) {
	err := parseError(500, []byte(`oops`))
	if err == nil || err.Error() != "request failed with status 500: oops" {
		t.Fatalf("expected fallback error, got %v", err)
	}
}

func TestParseImportOptionsCollectsUserMappings(t *testing.T) {
	path := writeImportFixture(t)
	options, err := parseImportOptions([]string{
		"--file", path,
		"--format", "harvest",
		"--dry-run",
		"--map", "Paul Connors=paul@example.com",
		"--map", "Jane Doe=jane@example.com",
	})
	if err != nil {
		t.Fatal(err)
	}
	if !options.dryRun {
		t.Fatal("expected dry run")
	}
	expected := []string{"Paul Connors=paul@example.com", "Jane Doe=jane@example.com"}
	if !reflect.DeepEqual(options.userMap, expected) {
		t.Fatalf("expected user mappings %v, got %v", expected, options.userMap)
	}
}

func TestParseImportOptionsRejectsOtherFormats(t *testing.T) {
	_, err := parseImportOptions([]string{"--file", writeImportFixture(t), "--format", "toggl"})
	if err == nil || err.Error() != "format must be harvest" {
		t.Fatalf("expected format error, got %v", err)
	}
}

func TestImportDryRunSendsMultipartFields(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet && r.URL.Path == "/api/v1/imports/1" {
			fmt.Fprint(w, `{"id":1,"status":"completed","dry_run":true,"summary":{"rows":1,"entries_to_create":1,"duplicates_skipped":0,"zero_hour_skipped":0,"clients":{"existing":[],"to_create":["Acme"]},"projects":{"existing":[],"to_create":["Acme / Website"]},"users":{"matched":{"Paul Connors":"paul@example.com"},"unmatched":[]},"date_range":{"from":"2026-01-01","to":"2026-01-01"},"warnings":[]},"row_errors":[]}`)
			return
		}
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/imports" {
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			http.Error(w, "unexpected request", http.StatusNotFound)
			return
		}
		if r.Header.Get("Authorization") != "Bearer test-token" {
			t.Errorf("unexpected authorization header: %s", r.Header.Get("Authorization"))
		}
		if err := r.ParseMultipartForm(1 << 20); err != nil {
			t.Errorf("parse multipart form: %v", err)
			http.Error(w, "invalid multipart form", http.StatusBadRequest)
			return
		}
		if r.FormValue("source") != "harvest" || r.FormValue("kind") != "time_entries" || r.FormValue("dry_run") != "true" {
			t.Errorf("unexpected multipart fields: %#v", r.MultipartForm.Value)
		}
		expectedMappings := []string{"Paul Connors=paul@example.com", "Jane Doe=jane@example.com"}
		if !reflect.DeepEqual(r.MultipartForm.Value["user_map[]"], expectedMappings) {
			t.Errorf("unexpected mappings: %#v", r.MultipartForm.Value["user_map[]"])
		}
		if r.FormValue("assign_unmatched_to") != "fallback@example.com" {
			t.Errorf("unexpected fallback: %s", r.FormValue("assign_unmatched_to"))
		}
		file, _, err := r.FormFile("file")
		if err != nil {
			t.Errorf("read uploaded file: %v", err)
			http.Error(w, "missing file", http.StatusBadRequest)
			return
		}
		file.Close()
		w.WriteHeader(http.StatusAccepted)
		fmt.Fprint(w, `{"id":1,"status":"pending","dry_run":true,"summary":{},"row_errors":[]}`)
	}))
	defer server.Close()

	originalInterval := importPollInterval
	importPollInterval = 0
	defer func() { importPollInterval = originalInterval }()
	cli := &client{baseURL: server.URL, token: "test-token"}
	err := cli.imports([]string{
		"--file", writeImportFixture(t),
		"--format", "harvest",
		"--dry-run",
		"--map", "Paul Connors=paul@example.com",
		"--map", "Jane Doe=jane@example.com",
		"--assign-unmatched-to", "fallback@example.com",
	})
	if err != nil {
		t.Fatal(err)
	}
	if requests.Load() != 2 {
		t.Fatalf("expected POST and one poll, got %d requests", requests.Load())
	}
}

func TestImportRealRunPollsUntilCompleted(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.Method == http.MethodPost && r.URL.Path == "/api/v1/imports":
			w.WriteHeader(http.StatusAccepted)
			fmt.Fprint(w, `{"id":42,"status":"pending","summary":{},"row_errors":[]}`)
		case r.Method == http.MethodGet && r.URL.Path == "/api/v1/imports/42":
			fmt.Fprint(w, `{"id":42,"status":"completed","total_rows":1,"imported_rows":1,"failed_rows":0,"summary":{"rows":1,"entries_created":1,"entries_failed":0,"duplicates_skipped":0,"zero_hour_skipped":0,"clients":{"existing":["Acme"],"to_create":[]},"projects":{"existing":["Acme / Website"],"to_create":[]},"users":{"matched":{"Paul Connors":"paul@example.com"},"unmatched":[]},"date_range":{"from":"2026-01-01","to":"2026-01-01"},"warnings":[]},"row_errors":[]}`)
		default:
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			http.Error(w, "unexpected request", http.StatusNotFound)
		}
	}))
	defer server.Close()

	originalInterval := importPollInterval
	importPollInterval = 0
	defer func() { importPollInterval = originalInterval }()
	cli := &client{baseURL: server.URL, token: "test-token"}
	if err := cli.imports([]string{"--file", writeImportFixture(t), "--format", "harvest"}); err != nil {
		t.Fatal(err)
	}
	if requests.Load() != 2 {
		t.Fatalf("expected POST and one poll, got %d requests", requests.Load())
	}
}

func TestImportRealRunReturnsServerFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodPost {
			w.WriteHeader(http.StatusAccepted)
			fmt.Fprint(w, `{"id":42,"status":"pending","summary":{},"row_errors":[]}`)
			return
		}
		fmt.Fprint(w, `{"id":42,"status":"failed","error_message":"Import failed. Support has been notified.","summary":{},"row_errors":[]}`)
	}))
	defer server.Close()

	originalInterval := importPollInterval
	importPollInterval = 0
	defer func() { importPollInterval = originalInterval }()
	err := (&client{baseURL: server.URL, token: "test-token"}).imports([]string{
		"--file", writeImportFixture(t), "--format", "harvest",
	})
	if err == nil || err.Error() != "Import failed. Support has been notified." {
		t.Fatalf("expected server failure message, got %v", err)
	}
}

func TestImportRealRunReturnsFailedRows(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodPost {
			w.WriteHeader(http.StatusAccepted)
			fmt.Fprint(w, `{"id":42,"status":"pending","summary":{},"row_errors":[]}`)
			return
		}
		fmt.Fprint(w, `{"id":42,"status":"completed","failed_rows":2,"summary":{"entries_created":3,"entries_failed":2},"row_errors":[]}`)
	}))
	defer server.Close()

	originalInterval := importPollInterval
	importPollInterval = 0
	defer func() { importPollInterval = originalInterval }()
	err := (&client{baseURL: server.URL, token: "test-token"}).imports([]string{
		"--file", writeImportFixture(t), "--format", "harvest",
	})
	if err == nil || err.Error() != "import completed with 2 failed rows" {
		t.Fatalf("expected failed row error, got %v", err)
	}
}

func TestImportDryRunReturnsUnmatchedUsers(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodPost {
			w.WriteHeader(http.StatusAccepted)
			fmt.Fprint(w, `{"id":1,"status":"pending","dry_run":true,"summary":{},"row_errors":[]}`)
			return
		}
		fmt.Fprint(w, `{"id":1,"status":"completed","dry_run":true,"summary":{"users":{"matched":{},"unmatched":["Paul Connors"]}},"row_errors":[]}`)
	}))
	defer server.Close()

	originalInterval := importPollInterval
	importPollInterval = 0
	defer func() { importPollInterval = originalInterval }()
	err := (&client{baseURL: server.URL, token: "test-token"}).imports([]string{
		"--file", writeImportFixture(t), "--format", "harvest", "--dry-run",
	})
	if err == nil || err.Error() != "dry run has unmatched users or row errors" {
		t.Fatalf("expected unmatched user error, got %v", err)
	}
}

func TestImportStatus(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		if r.Method != http.MethodGet || r.URL.Path != "/api/v1/imports/42" {
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			http.Error(w, "unexpected request", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"id":42,"status":"completed","summary":{"entries_created":3,"entries_failed":0},"row_errors":[]}`)
	}))
	defer server.Close()

	err := (&client{baseURL: server.URL, token: "test-token"}).imports([]string{"status", "--id", "42"})
	if err != nil {
		t.Fatal(err)
	}
	if requests.Load() != 1 {
		t.Fatalf("expected one status request, got %d", requests.Load())
	}
}

func writeImportFixture(t *testing.T) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "harvest.csv")
	if err := os.WriteFile(path, []byte("Date,Client,Project,Hours,First Name,Last Name\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}
