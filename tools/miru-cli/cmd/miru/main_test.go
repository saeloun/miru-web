package main

import "testing"

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
