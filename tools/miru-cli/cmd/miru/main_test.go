package main

import (
	"os"
	"path/filepath"
	"testing"
)

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
