```bash
docker run -d --name valkey-with-auth -p 6379:6379 valkey/valkey:7-alpine valkey-server --requirepass "StrongPassword@123"
```

```env
VALKEY_HOST=localhost
VALKEY_PORT=6379
VALKEY_PASSWORD=StrongPassword@123
```