# API Usage Examples

## Working with Clients by Name

All client operations now support querying by name in addition to client ID. Simply add `?byName=true` to the query string.

### Get Client Information

**By ID:**
```bash
curl http://localhost:51821/api/wireguard/client/abc-123-def-456
```

**By Name:**
```bash
curl "http://localhost:51821/api/wireguard/client/John's%20Phone?byName=true"
```

### Download Configuration

**By ID:**
```bash
curl http://localhost:51821/api/wireguard/client/abc-123-def-456/configuration -o config.conf
```

**By Name:**
```bash
curl "http://localhost:51821/api/wireguard/client/John's%20Phone/configuration?byName=true" -o johns-phone.conf
```

### Get QR Codes

**SVG format by ID:**
```bash
curl http://localhost:51821/api/wireguard/client/abc-123-def-456/qrcode.svg > qr.svg
```

**SVG format by Name:**
```bash
curl "http://localhost:51821/api/wireguard/client/John's%20Phone/qrcode.svg?byName=true" > qr.svg
```

**PNG format by ID:**
```bash
curl http://localhost:51821/api/wireguard/client/abc-123-def-456/qrcode.png > qr.png
```

**PNG format by Name:**
```bash
curl "http://localhost:51821/api/wireguard/client/John's%20Phone/qrcode.png?byName=true" > qr.png
```

### Enable/Disable Clients

**Enable by ID:**
```bash
curl -X POST http://localhost:51821/api/wireguard/client/abc-123-def-456/enable
```

**Enable by Name:**
```bash
curl -X POST "http://localhost:51821/api/wireguard/client/John's%20Phone/enable?byName=true"
```

**Disable by ID:**
```bash
curl -X POST http://localhost:51821/api/wireguard/client/abc-123-def-456/disable
```

**Disable by Name:**
```bash
curl -X POST "http://localhost:51821/api/wireguard/client/John's%20Phone/disable?byName=true"
```

### Update Client Properties

**Update name by ID:**
```bash
curl -X PUT http://localhost:51821/api/wireguard/client/abc-123-def-456/name \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

**Update name by current name:**
```bash
curl -X PUT "http://localhost:51821/api/wireguard/client/John's%20Phone/name?byName=true" \
  -H "Content-Type: application/json" \
  -d '{"name": "John New Phone"}'
```

**Update address by ID:**
```bash
curl -X PUT http://localhost:51821/api/wireguard/client/abc-123-def-456/address \
  -H "Content-Type: application/json" \
  -d '{"address": "10.8.0.10"}'
```

**Update address by name:**
```bash
curl -X PUT "http://localhost:51821/api/wireguard/client/John's%20Phone/address?byName=true" \
  -H "Content-Type: application/json" \
  -d '{"address": "10.8.0.10"}'
```

### Delete Client

**Delete by ID:**
```bash
curl -X DELETE http://localhost:51821/api/wireguard/client/abc-123-def-456
```

**Delete by Name:**
```bash
curl -X DELETE "http://localhost:51821/api/wireguard/client/John's%20Phone?byName=true"
```

## URL Encoding for Names with Special Characters

When using client names in URLs, make sure to properly encode special characters:

**In Bash:**
```bash
CLIENT_NAME="John's Phone"
ENCODED_NAME=$(echo -n "$CLIENT_NAME" | jq -sRr @uri)
curl "http://localhost:51821/api/wireguard/client/$ENCODED_NAME?byName=true"
```

**In Python:**
```python
import urllib.parse
import requests

client_name = "John's Phone"
encoded_name = urllib.parse.quote(client_name)
url = f"http://localhost:51821/api/wireguard/client/{encoded_name}?byName=true"
response = requests.get(url)
print(response.json())
```

**In JavaScript:**
```javascript
const clientName = "John's Phone";
const encodedName = encodeURIComponent(clientName);
const url = `http://localhost:51821/api/wireguard/client/${encodedName}?byName=true`;

fetch(url)
  .then(response => response.json())
  .then(data => console.log(data));
```

## Automation Script Examples

### Bash Script - Manage Client by Name

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:51821"
CLIENT_NAME="John's Phone"

# Encode name for URL
encode_name() {
  echo -n "$1" | jq -sRr @uri
}

# Get client info
get_client() {
  local encoded=$(encode_name "$CLIENT_NAME")
  curl -s "${BASE_URL}/api/wireguard/client/${encoded}?byName=true"
}

# Enable client
enable_client() {
  local encoded=$(encode_name "$CLIENT_NAME")
  curl -s -X POST "${BASE_URL}/api/wireguard/client/${encoded}/enable?byName=true"
  echo "Client '$CLIENT_NAME' enabled"
}

# Disable client
disable_client() {
  local encoded=$(encode_name "$CLIENT_NAME")
  curl -s -X POST "${BASE_URL}/api/wireguard/client/${encoded}/disable?byName=true"
  echo "Client '$CLIENT_NAME' disabled"
}

# Download config
download_config() {
  local encoded=$(encode_name "$CLIENT_NAME")
  local filename=$(echo "$CLIENT_NAME" | tr ' ' '-' | tr -cd '[:alnum:]-_').conf
  curl -s "${BASE_URL}/api/wireguard/client/${encoded}/configuration?byName=true" > "$filename"
  echo "Configuration saved to $filename"
}

# Download QR code
download_qr() {
  local encoded=$(encode_name "$CLIENT_NAME")
  local filename=$(echo "$CLIENT_NAME" | tr ' ' '-' | tr -cd '[:alnum:]-_').png
  curl -s "${BASE_URL}/api/wireguard/client/${encoded}/qrcode.png?byName=true" > "$filename"
  echo "QR code saved to $filename"
}

# Main menu
case "${1:-help}" in
  info)
    get_client | jq .
    ;;
  enable)
    enable_client
    ;;
  disable)
    disable_client
    ;;
  config)
    download_config
    ;;
  qr)
    download_qr
    ;;
  *)
    echo "Usage: $0 {info|enable|disable|config|qr}"
    exit 1
    ;;
esac
```

### Python Script - Batch Operations

```python
#!/usr/bin/env python3
import requests
from urllib.parse import quote
import json

BASE_URL = "http://localhost:51821"

class WireGuardClient:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def get_by_name(self, name):
        """Get client by name"""
        encoded_name = quote(name)
        url = f"{self.base_url}/api/wireguard/client/{encoded_name}?byName=true"
        response = requests.get(url)
        return response.json()
    
    def enable_by_name(self, name):
        """Enable client by name"""
        encoded_name = quote(name)
        url = f"{self.base_url}/api/wireguard/client/{encoded_name}/enable?byName=true"
        response = requests.post(url)
        return response.status_code == 200
    
    def disable_by_name(self, name):
        """Disable client by name"""
        encoded_name = quote(name)
        url = f"{self.base_url}/api/wireguard/client/{encoded_name}/disable?byName=true"
        response = requests.post(url)
        return response.status_code == 200
    
    def get_config_by_name(self, name):
        """Get configuration by name"""
        encoded_name = quote(name)
        url = f"{self.base_url}/api/wireguard/client/{encoded_name}/configuration?byName=true"
        response = requests.get(url)
        return response.text
    
    def get_qr_by_name(self, name, format='png'):
        """Get QR code by name"""
        encoded_name = quote(name)
        url = f"{self.base_url}/api/wireguard/client/{encoded_name}/qrcode.{format}?byName=true"
        response = requests.get(url)
        return response.content

# Example usage
if __name__ == "__main__":
    client = WireGuardClient(BASE_URL)
    
    # Enable multiple clients by name
    client_names = ["John's Phone", "Jane's Laptop", "Office PC"]
    
    for name in client_names:
        try:
            info = client.get_by_name(name)
            print(f"Client: {name}")
            print(f"  Status: {'Enabled' if info['enabled'] else 'Disabled'}")
            print(f"  Address: {info['address']}")
            
            if not info['enabled']:
                client.enable_by_name(name)
                print(f"  -> Enabled")
        except Exception as e:
            print(f"Error processing {name}: {e}")
```

## Tips and Best Practices

1. **Name Uniqueness**: Client names should be unique to avoid ambiguity
2. **URL Encoding**: Always encode client names when using in URLs
3. **Error Handling**: Check for 404 errors when client with given name doesn't exist
4. **Performance**: Using ID is slightly faster than searching by name
5. **Compatibility**: All endpoints support both ID and name-based access

## Common Patterns

### Find and Update
```bash
# Find client by name and update its address
CLIENT_NAME="John's Phone"
ENCODED=$(echo -n "$CLIENT_NAME" | jq -sRr @uri)

curl -X PUT "http://localhost:51821/api/wireguard/client/$ENCODED/address?byName=true" \
  -H "Content-Type: application/json" \
  -d '{"address": "10.8.0.50"}'
```

### Conditional Operations
```bash
# Enable client only if it exists
CLIENT_NAME="John's Phone"
ENCODED=$(echo -n "$CLIENT_NAME" | jq -sRr @uri)

if curl -s "http://localhost:51821/api/wireguard/client/$ENCODED?byName=true" | jq -e . >/dev/null 2>&1; then
  curl -X POST "http://localhost:51821/api/wireguard/client/$ENCODED/enable?byName=true"
  echo "Client enabled"
else
  echo "Client not found"
fi
```

### Batch Download Configurations
```bash
#!/bin/bash
# Download configs for all clients with specific pattern

for name in "John's Phone" "Jane's Laptop" "Office Desktop"; do
  encoded=$(echo -n "$name" | jq -sRr @uri)
  filename=$(echo "$name" | tr ' ' '-').conf
  
  curl -s "http://localhost:51821/api/wireguard/client/$encoded/configuration?byName=true" > "$filename"
  echo "Downloaded: $filename"
done
```
