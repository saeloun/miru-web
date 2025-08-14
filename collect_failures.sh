#!/bin/bash

# Simple script to collect all RSpec failures for Claude analysis

echo "🔍 Collecting test failures for Claude..."
echo "========================================"

# Create output directory
mkdir -p tmp/test_failures

# Run parallel tests and capture output
echo "Running tests in parallel..."
bundle exec parallel_rspec -n 4 spec/system/ --format documentation 2>&1 | tee tmp/test_failures/output.txt

# Extract just the failure summary
echo ""
echo "Extracting failures..."
grep -E "^rspec |^\s+\d+\)|Failure/Error:|# \./spec/" tmp/test_failures/output.txt > tmp/test_failures/failures_only.txt

# Create a clean summary
cat > tmp/test_failures/summary_for_claude.md << 'EOF'
# Test Failures Summary

## How to use this file:
1. Copy the contents below
2. Paste to Claude saying: "Here are the test failures, please help fix them"

## Failures:
EOF

# Add the failures
echo '```' >> tmp/test_failures/summary_for_claude.md
grep "^rspec " tmp/test_failures/output.txt >> tmp/test_failures/summary_for_claude.md
echo '```' >> tmp/test_failures/summary_for_claude.md

# Count failures
FAILURE_COUNT=$(grep -c "^rspec " tmp/test_failures/output.txt)

echo ""
echo "========================================"
echo "✅ Collection complete!"
echo "📊 Total failures: $FAILURE_COUNT"
echo ""
echo "📄 Files created:"
echo "   • tmp/test_failures/summary_for_claude.md - Share this with Claude"
echo "   • tmp/test_failures/output.txt - Full output"
echo "   • tmp/test_failures/failures_only.txt - Just the failures"
echo ""
echo "💡 To share with Claude, run:"
echo "   cat tmp/test_failures/summary_for_claude.md"
echo ""