#!/bin/bash

# Cloudflare API configuration
CF_API_TOKEN="6G8Yy50u1xy9bCSwMRdHJTkw8sorl6uKF_LIvQAY"
CF_API_URL="https://api.cloudflare.com/client/v4"

# First, get the Zone ID for miru.so
echo "Getting Zone ID for miru.so..."
ZONE_RESPONSE=$(curl -s -X GET "$CF_API_URL/zones?name=miru.so" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['result'][0]['id'] if data['success'] and data['result'] else 'ERROR')")

if [ "$ZONE_ID" = "ERROR" ]; then
  echo "Failed to get Zone ID. Response:"
  echo "$ZONE_RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "Zone ID: $ZONE_ID"

# Check if *.review.miru.so already exists
echo "Checking for existing *.review.miru.so record..."
EXISTING_RECORD=$(curl -s -X GET "$CF_API_URL/zones/$ZONE_ID/dns_records?name=*.review.miru.so&type=A" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

RECORD_COUNT=$(echo "$EXISTING_RECORD" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('result', [])))")

if [ "$RECORD_COUNT" -gt "0" ]; then
  echo "Record already exists. Updating..."
  RECORD_ID=$(echo "$EXISTING_RECORD" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['result'][0]['id'])")
  
  UPDATE_RESPONSE=$(curl -s -X PUT "$CF_API_URL/zones/$ZONE_ID/dns_records/$RECORD_ID" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{
      "type": "A",
      "name": "*.review",
      "content": "91.98.79.189",
      "ttl": 1,
      "proxied": false
    }')
  
  echo "Update response:"
  echo "$UPDATE_RESPONSE" | python3 -m json.tool
else
  echo "Creating new DNS record for *.review.miru.so..."
  
  CREATE_RESPONSE=$(curl -s -X POST "$CF_API_URL/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{
      "type": "A",
      "name": "*.review",
      "content": "91.98.79.189",
      "ttl": 1,
      "proxied": false,
      "comment": "Wildcard for review apps on Hetzner"
    }')
  
  echo "Create response:"
  echo "$CREATE_RESPONSE" | python3 -m json.tool
fi

echo ""
echo "DNS configuration complete. Testing resolution..."
echo "Waiting 5 seconds for DNS propagation..."
sleep 5

# Test DNS resolution
echo "Testing miru-2-0-upgrade.review.miru.so..."
dig +short miru-2-0-upgrade.review.miru.so