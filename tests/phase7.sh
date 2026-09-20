#!/bin/bash
# لاین نوری استار — تست یکپارچه فاز ۷ (curl)
# اجرا: bash tests/phase7.sh
# پیش‌نیاز: php + python3. سرورها را خودش بالا/پایین می‌کند.
set -u
cd "$(dirname "$0")/.."
rm -f api/.data.sqlite* /tmp/p7_*.txt /tmp/p7_*.json
php -S localhost:8001 api/index.php >/tmp/p7_php.log 2>&1 &
PHP_PID=$!
python3 -m http.server 8000 --directory . >/tmp/p7_http.log 2>&1 &
HTTP_PID=$!
sleep 2
PASS=0; FAIL=0
check() { # check <name> <expected_code> <curl_args...>
  local name="$1" expect="$2"; shift 2
  local code
  code=$(curl -s -o /tmp/p7_out.json -w "%{http_code}" "$@")
  if [ "$code" = "$expect" ]; then PASS=$((PASS+1)); echo "PASS [$code] $name";
  else FAIL=$((FAIL+1)); echo "FAIL [$code≠$expect] $name :: $(head -c 200 /tmp/p7_out.json)"; fi
}
csrf_of() { python3 -c "
import http.cookiejar
j=http.cookiejar.MozillaCookieJar('$1'); j.load()
print([c.value for c in j if c.name=='lns_csrf'][0])"; }

echo "== 7.1 servers =="
check "health" 200 http://localhost:8001/health
check "frontend index" 200 http://localhost:8000/index.html

echo "== 7.2.2 anonymous =="
curl -s "http://localhost:8001/products/list?limit=100" -o /tmp/p7_prod.json
N=$(python3 -c "import json;print(len(json.load(open('/tmp/p7_prod.json'))['items']))")
[ "$N" = "12" ] && { PASS=$((PASS+1)); echo "PASS [12] anon products=12"; } || { FAIL=$((FAIL+1)); echo "FAIL anon products=$N"; }
check "me anon 401" 401 http://localhost:8001/auth/me
curl -s -c /tmp/p7_anon.txt http://localhost:8001/ -o /dev/null
ANON_CSRF=$(csrf_of /tmp/p7_anon.txt)
check "quote no-auth 401" 401 -b /tmp/p7_anon.txt -X POST http://localhost:8001/quotes/create -H 'Content-Type: application/json' -H "X-CSRF-Token: $ANON_CSRF" -d '{"product_id":"x","quantity":1}'

echo "== 7.2.3 register admin =="
check "register admin" 201 -b /tmp/p7_anon.txt -c /tmp/p7_admin.txt -X POST http://localhost:8001/auth/register -H 'Content-Type: application/json' -H "X-CSRF-Token: $ANON_CSRF" -d '{"name":"مدیر تست","phone":"09123456789","email":"admin@t.ir","pass":"Test1234","pass2":"Test1234"}'
python3 -c "import json;d=json.load(open('/tmp/p7_out.json'));assert d['user']['role']=='admin',d;print('role=admin ok')"
ADMIN_CSRF=$(csrf_of /tmp/p7_admin.txt)

echo "== 7.2.4 login =="
check "login admin" 200 -b /tmp/p7_admin.txt -c /tmp/p7_admin.txt -X POST http://localhost:8001/auth/login -H 'Content-Type: application/json' -H "X-CSRF-Token: $ADMIN_CSRF" -d '{"identifier":"admin@t.ir","pass":"Test1234"}'
ADMIN_CSRF=$(csrf_of /tmp/p7_admin.txt)

echo "== 7.2.5 admin ops =="
check "users list 1" 200 -b /tmp/p7_admin.txt "http://localhost:8001/users/list"
check "product create" 201 -b /tmp/p7_admin.txt -X POST http://localhost:8001/products/create -H 'Content-Type: application/json' -H "X-CSRF-Token: $ADMIN_CSRF" -d '{"name":"لاین تست هفت","cat":"mono","price":99000,"stock":10}'
PRODID=$(python3 -c "import json;print(json.load(open('/tmp/p7_out.json'))['id'])")
check "product update" 200 -b /tmp/p7_admin.txt -X POST http://localhost:8001/products/update -H 'Content-Type: application/json' -H "X-CSRF-Token: $ADMIN_CSRF" -d "{\"id\":\"$PRODID\",\"price\":89000}"
check "product delete" 200 -b /tmp/p7_admin.txt -X POST http://localhost:8001/products/delete -H 'Content-Type: application/json' -H "X-CSRF-Token: $ADMIN_CSRF" -d "{\"id\":\"$PRODID\"}"

echo "== 7.2.6 register customer =="
curl -s -c /tmp/p7_user.txt http://localhost:8001/ -o /dev/null
U_CSRF=$(csrf_of /tmp/p7_user.txt)
check "register customer" 201 -b /tmp/p7_user.txt -c /tmp/p7_user.txt -X POST http://localhost:8001/auth/register -H 'Content-Type: application/json' -H "X-CSRF-Token: $U_CSRF" -d '{"name":"کاربر عادی","phone":"09111111111","email":"user@t.ir","pass":"User1234","pass2":"User1234"}'
python3 -c "import json;d=json.load(open('/tmp/p7_out.json'));assert d['user']['role']=='customer',d;print('role=customer ok')"
U_CSRF=$(csrf_of /tmp/p7_user.txt)

echo "== 7.2.7 customer ops =="
check "customer quote" 201 -b /tmp/p7_user.txt -X POST http://localhost:8001/quotes/create -H 'Content-Type: application/json' -H "X-CSRF-Token: $U_CSRF" -d '{"product_id":"00000000-0000-4000-8000-000000000001","quantity":2,"message":"تست هفت"}'
curl -s -b /tmp/p7_user.txt "http://localhost:8001/quotes/list" -o /tmp/p7_q.json
NQ=$(python3 -c "import json;print(len(json.load(open('/tmp/p7_q.json'))['items']))")
[ "$NQ" = "1" ] && { PASS=$((PASS+1)); echo "PASS customer quotes=1"; } || { FAIL=$((FAIL+1)); echo "FAIL customer quotes=$NQ"; }
check "customer product-create 403" 403 -b /tmp/p7_user.txt -X POST http://localhost:8001/products/create -H 'Content-Type: application/json' -H "X-CSRF-Token: $U_CSRF" -d '{"name":"x","cat":"mono","price":1}'

echo "== 7.2.8 admin sees all =="
curl -s -b /tmp/p7_admin.txt -X POST http://localhost:8001/quotes/create -H 'Content-Type: application/json' -H "X-CSRF-Token: $ADMIN_CSRF" -d '{"product_id":"00000000-0000-4000-8000-000000000002","quantity":1}' -o /dev/null
curl -s -b /tmp/p7_admin.txt "http://localhost:8001/quotes/list" -o /tmp/p7_qa.json
NQ=$(python3 -c "import json;print(len(json.load(open('/tmp/p7_qa.json'))['items']))")
[ "$NQ" = "2" ] && { PASS=$((PASS+1)); echo "PASS admin quotes=2"; } || { FAIL=$((FAIL+1)); echo "FAIL admin quotes=$NQ"; }

echo "== 7.2.9 messages =="
check "customer send" 201 -b /tmp/p7_user.txt -X POST http://localhost:8001/messages/send -H 'Content-Type: application/json' -H "X-CSRF-Token: $U_CSRF" -d '{"subject":"تست","body":"پیام تست هفت"}'
curl -s -b /tmp/p7_admin.txt "http://localhost:8001/messages/list" -o /tmp/p7_m.json
NM=$(python3 -c "import json;print(len(json.load(open('/tmp/p7_m.json'))['items']))")
[ "$NM" = "1" ] && { PASS=$((PASS+1)); echo "PASS admin msgs=1"; } || { FAIL=$((FAIL+1)); echo "FAIL admin msgs=$NM"; }

echo "== 7.2.10 security =="
check "no-CSRF 403" 403 -b /tmp/p7_admin.txt -X POST http://localhost:8001/products/create -H 'Content-Type: application/json' -d '{"name":"x","cat":"mono","price":1}'
for i in 1 2 3 4 5; do curl -s -o /dev/null -b /tmp/p7_anon.txt -X POST http://localhost:8001/auth/login -H 'Content-Type: application/json' -H "X-CSRF-Token: $ANON_CSRF" -d '{"identifier":"rl7@t.ir","pass":"Wrong123"}'; done
check "rate-limit 429" 429 -b /tmp/p7_anon.txt -X POST http://localhost:8001/auth/login -H 'Content-Type: application/json' -H "X-CSRF-Token: $ANON_CSRF" -d '{"identifier":"rl7@t.ir","pass":"Wrong123"}'
check "weak pass 422" 422 -b /tmp/p7_anon.txt -X POST http://localhost:8001/auth/register -H 'Content-Type: application/json' -H "X-CSRF-Token: $ANON_CSRF" -d '{"name":"ضعیف","phone":"09222222222","email":"weak7@t.ir","pass":"weak","pass2":"weak"}'
check "sqli email" 422 -b /tmp/p7_anon.txt -X POST http://localhost:8001/auth/register -H 'Content-Type: application/json' -H "X-CSRF-Token: $ANON_CSRF" -d '{"name":"هکر","phone":"09333333333","email":"x@t.ir OR 1=1--","pass":"Test1234","pass2":"Test1234"}'
check "xss product" 201 -b /tmp/p7_admin.txt -X POST http://localhost:8001/products/create -H 'Content-Type: application/json' -H "X-CSRF-Token: $ADMIN_CSRF" -d '{"name":"<script>alert(1)</script>تست","cat":"mono","price":1000}'
XID=$(python3 -c "import json;print(json.load(open('/tmp/p7_out.json'))['id'])")
curl -s "http://localhost:8001/products/list?limit=100" -o /tmp/p7_all.json
python3 -c "
import json
items=json.load(open('/tmp/p7_all.json'))['items']
hit=[p for p in items if p['id']=='$XID'][0]
assert '<' not in hit['name'] and '>' not in hit['name'], hit['name']
print('xss sanitized:', hit['name'])" && { PASS=$((PASS+1)); echo "PASS xss sanitized"; } || { FAIL=$((FAIL+1)); echo "FAIL xss stored raw"; }

echo "== RESULT: PASS=$PASS FAIL=$FAIL =="
kill $PHP_PID $HTTP_PID 2>/dev/null
exit $FAIL
