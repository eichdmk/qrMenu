# SSL Certificates

Place your TLS certificate and key files in this directory before starting the stack.

Expected filenames by default configuration:

- `server.crt` – full certificate chain
- `server.key` – private key

You can update the paths via environment variables `SSL_CERT_PATH` and `SSL_KEY_PATH` if needed.

To generate a long-lived self-signed certificate for staging or internal usage, run:

```bash
openssl req -x509 -nodes -newkey rsa:4096 \
  -keyout infra/certs/server.key \
  -out infra/certs/server.crt \
  -days 3650 \
  -subj "/CN=example.com"
```

Replace `example.com` with your actual domain. For public deployments, obtain trusted certificates via Let’s Encrypt using the `certbot` service described in the documentation.

