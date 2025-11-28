# Quick Reference: Access Clients by Name

## Overview

All client operations now support accessing clients by **name** in addition to **client ID**.

Simply add `?byName=true` to any endpoint that accepts `:clientId`.

## URL Pattern

```
Before: /api/wireguard/client/{clientId}/{operation}
Now:    /api/wireguard/client/{clientName}/{operation}?byName=true
```

## Supported Operations

| Operation | By ID | By Name |
|-----------|-------|---------|
| Get client info | `GET /client/:id` | `GET /client/:name?byName=true` |
| Download config | `GET /client/:id/configuration` | `GET /client/:name/configuration?byName=true` |
| QR code (SVG) | `GET /client/:id/qrcode.svg` | `GET /client/:name/qrcode.svg?byName=true` |
| QR code (PNG) | `GET /client/:id/qrcode.png` | `GET /client/:name/qrcode.png?byName=true` |
| Enable client | `POST /client/:id/enable` | `POST /client/:name/enable?byName=true` |
| Disable client | `POST /client/:id/disable` | `POST /client/:name/disable?byName=true` |
| Update name | `PUT /client/:id/name` | `PUT /client/:name/name?byName=true` |
| Update address | `PUT /client/:id/address` | `PUT /client/:name/address?byName=true` |
| Delete client | `DELETE /client/:id` | `DELETE /client/:name?byName=true` |

## Quick Examples

### Get Client
```bash
# By ID
curl http://localhost:51821/api/wireguard/client/abc-123

# By Name
curl "http://localhost:51821/api/wireguard/client/John's%20Phone?byName=true"
```

### Download Configuration
```bash
# By ID
curl http://localhost:51821/api/wireguard/client/abc-123/configuration -o config.conf

# By Name
curl "http://localhost:51821/api/wireguard/client/John's%20Phone/configuration?byName=true" -o config.conf
```

### Enable/Disable
```bash
# By ID
curl -X POST http://localhost:51821/api/wireguard/client/abc-123/enable

# By Name
curl -X POST "http://localhost:51821/api/wireguard/client/John's%20Phone/enable?byName=true"
```

### Delete
```bash
# By ID
curl -X DELETE http://localhost:51821/api/wireguard/client/abc-123

# By Name
curl -X DELETE "http://localhost:51821/api/wireguard/client/John's%20Phone?byName=true"
```

## URL Encoding Helper

Names with spaces or special characters must be URL-encoded:

```bash
# Simple encoding in bash
CLIENT_NAME="John's Phone"
ENCODED=$(echo -n "$CLIENT_NAME" | jq -sRr @uri)
curl "http://localhost:51821/api/wireguard/client/$ENCODED?byName=true"
```

## Common Patterns

### Check if client exists
```bash
if curl -sf "http://localhost:51821/api/wireguard/client/ClientName?byName=true" > /dev/null; then
  echo "Client exists"
fi
```

### Enable multiple clients
```bash
for name in "Client1" "Client2" "Client3"; do
  encoded=$(echo -n "$name" | jq -sRr @uri)
  curl -X POST "http://localhost:51821/api/wireguard/client/$encoded/enable?byName=true"
done
```

### Download all configs by name
```bash
for name in "John" "Jane" "Bob"; do
  encoded=$(echo -n "$name" | jq -sRr @uri)
  curl "http://localhost:51821/api/wireguard/client/$encoded/configuration?byName=true" > "${name}.conf"
done
```

## Notes

- ✅ Client names should be unique
- ✅ URL encoding is required for special characters
- ✅ Works with all client operations
- ✅ Returns 404 if client not found
- ✅ Fully backward compatible (ID-based access still works)

## See Also

- [API_EXAMPLES.md](./API_EXAMPLES.md) - Detailed examples with multiple languages
- [README.md](./README.md) - Full API documentation
- [CHANGES.md](./CHANGES.md) - Complete changelog
