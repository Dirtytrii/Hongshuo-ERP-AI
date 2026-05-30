#!/usr/bin/env bash
set -euo pipefail

PAGES_ORIGIN="${PAGES_ORIGIN:-https://hongshuo-erp-ai.pages.dev}"
API_DOMAIN="${API_DOMAIN:-http://api-hongshuo.dingai.site}"
DIRECT_BACKEND="${DIRECT_BACKEND:-http://8.163.60.63:9101}"

failures=0

status_code() {
  local method="$1"
  local url="$2"
  shift 2
  curl -sS -o /tmp/hongshuo-security-check-body -w "%{http_code}" --max-time 10 -X "$method" "$url" "$@"
}

assert_status() {
  local label="$1"
  local expected="$2"
  local method="$3"
  local url="$4"
  shift 4
  local actual
  actual="$(status_code "$method" "$url" "$@")"
  if [[ "$actual" == "$expected" ]]; then
    printf 'ok   %-54s %s\n' "$label" "$actual"
  else
    printf 'fail %-54s expected=%s actual=%s\n' "$label" "$expected" "$actual"
    failures=$((failures + 1))
  fi
}

assert_not_status() {
  local label="$1"
  local forbidden="$2"
  local method="$3"
  local url="$4"
  shift 4
  local actual
  actual="$(status_code "$method" "$url" "$@" || true)"
  if [[ "$actual" != "$forbidden" ]]; then
    printf 'ok   %-54s actual=%s\n' "$label" "$actual"
  else
    printf 'fail %-54s forbidden=%s\n' "$label" "$forbidden"
    failures=$((failures + 1))
  fi
}

assert_no_default_token() {
  local label="$1"
  local url="$2"
  local body_file
  body_file="$(mktemp)"
  local actual
  actual="$(
    curl -sS -o "$body_file" -w "%{http_code}" --max-time 10 \
      -X POST "$url/api/auth/login" \
      -H 'Content-Type: application/json' \
      --data '{"username":"admin","password":"123456"}' || true
  )"

  if [[ "$actual" == "200" ]] && node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.exit(j.token ? 0 : 1)" "$body_file"; then
    printf 'fail %-54s returned admin token\n' "$label"
    failures=$((failures + 1))
  else
    printf 'ok   %-54s status=%s no-token\n' "$label" "$actual"
  fi
  rm -f "$body_file"
}

assert_status 'Pages unauthenticated projects' 401 GET "$PAGES_ORIGIN/api/projects"
assert_status 'Pages hidden OpenAPI docs' 404 GET "$PAGES_ORIGIN/api/v3/api-docs"
assert_status 'Pages blocks default admin password' 401 POST "$PAGES_ORIGIN/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data '{"username":"admin","password":"123456"}'

assert_not_status 'API domain unauthenticated projects' 200 GET "$API_DOMAIN/api/projects"
assert_not_status 'Direct backend unauthenticated projects' 200 GET "$DIRECT_BACKEND/api/projects"
assert_no_default_token 'API domain default admin password' "$API_DOMAIN"
assert_no_default_token 'Direct backend default admin password' "$DIRECT_BACKEND"

if [[ "$failures" -gt 0 ]]; then
  printf '\n%d security check(s) failed.\n' "$failures"
  exit 1
fi

printf '\nAll public API containment checks passed.\n'
