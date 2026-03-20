#!/usr/bin/env bash
set -euo pipefail

# Generate self-signed TLS certs for local/staging use.
# Usage:
#   ./deployment/scripts/generate-tls-certs.sh \
#     --domain mednat.ieeta.pt \
#     --alt mednat.ieeta.pt,localhost,127.0.0.1 \
#     --days 365

DOMAIN=""
ALT_NAMES=""
DAYS=365
OUT_DIR="deployment/certs"
KEY_FILE=""
CERT_FILE=""

usage() {
  cat <<USAGE
Usage: $0 --domain <primary-domain> [options]

Options:
  --domain <name>       Primary certificate CN (required)
  --alt <csv>           Subject Alternative Names CSV (default: domain)
  --days <n>            Validity in days (default: 365)
  --out-dir <path>      Output directory (default: deployment/certs)
  --key-file <name>     Private key filename (default: <domain>.key)
  --cert-file <name>    Certificate filename (default: <domain>.crt)
  -h, --help            Show this help

Example:
  $0 --domain mednat.ieeta.pt --alt mednat.ieeta.pt,localhost,127.0.0.1
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="${2:-}"
      shift 2
      ;;
    --alt)
      ALT_NAMES="${2:-}"
      shift 2
      ;;
    --days)
      DAYS="${2:-}"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="${2:-}"
      shift 2
      ;;
    --key-file)
      KEY_FILE="${2:-}"
      shift 2
      ;;
    --cert-file)
      CERT_FILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "Error: --domain is required" >&2
  usage
  exit 1
fi

if [[ -z "$ALT_NAMES" ]]; then
  ALT_NAMES="$DOMAIN"
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "Error: openssl is required but not installed." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

if [[ -z "$KEY_FILE" ]]; then
  KEY_FILE="$DOMAIN.key"
fi
if [[ -z "$CERT_FILE" ]]; then
  CERT_FILE="$DOMAIN.crt"
fi

KEY_PATH="$OUT_DIR/$KEY_FILE"
CERT_PATH="$OUT_DIR/$CERT_FILE"
EXT_PATH="$OUT_DIR/$DOMAIN.ext"

IFS=',' read -r -a SAN_ARRAY <<< "$ALT_NAMES"
SAN_LINE=""
idx=1
for san in "${SAN_ARRAY[@]}"; do
  san_trimmed="$(echo "$san" | xargs)"
  if [[ -z "$san_trimmed" ]]; then
    continue
  fi
  if [[ "$san_trimmed" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    SAN_LINE+="IP.${idx} = ${san_trimmed}"$'\n'
  else
    SAN_LINE+="DNS.${idx} = ${san_trimmed}"$'\n'
  fi
  idx=$((idx + 1))
done

cat > "$EXT_PATH" <<EXT
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
${SAN_LINE}
EXT

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$KEY_PATH" \
  -out "$CERT_PATH" \
  -days "$DAYS" \
  -subj "/CN=$DOMAIN" \
  -extensions v3_req \
  -config <(cat /etc/ssl/openssl.cnf <(printf "[v3_req]\nsubjectAltName=@alt_names\n[alt_names]\n%s" "$SAN_LINE"))

chmod 600 "$KEY_PATH"
chmod 644 "$CERT_PATH"

echo "Generated:"
echo "  Key : $KEY_PATH"
echo "  Cert: $CERT_PATH"
echo "  SAN : $ALT_NAMES"
echo ""
echo "Next step: mount these files into nginx and configure listen 443 ssl."
