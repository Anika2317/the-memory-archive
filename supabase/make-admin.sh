#!/bin/bash
# Creates (or resets the password of) an admin account for the archive.
# Run from the project folder after `supabase login`:  bash supabase/make-admin.sh
set -euo pipefail

REF=wbbezfdkqvafgmcgiexz
URL="https://$REF.supabase.co"

read -rp "Admin email: " EMAIL
read -rsp "Choose a password (at least 8 characters, nothing shows as you type): " PASS
echo
if [ ${#PASS} -lt 8 ]; then echo "That password is too short."; exit 1; fi

KEY=$(supabase projects api-keys --project-ref "$REF" -o json |
  python3 -c "import sys,json; print([k['api_key'] for k in json.load(sys.stdin) if k['name']=='service_role'][0])")
BODY=$(EMAIL="$EMAIL" PASS="$PASS" python3 -c "import os,json; print(json.dumps({'email':os.environ['EMAIL'],'password':os.environ['PASS'],'email_confirm':True}))")

ID=$(curl -s "$URL/auth/v1/admin/users" -X POST -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")

if [ -z "$ID" ]; then
  # The account already exists: find it and set the new password.
  ID=$(curl -s "$URL/auth/v1/admin/users?per_page=1000" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" |
    EMAIL="$EMAIL" python3 -c "import os,sys,json; print(next((u['id'] for u in json.load(sys.stdin)['users'] if (u.get('email') or '').lower()==os.environ['EMAIL'].lower()), ''))")
  if [ -z "$ID" ]; then echo "Couldn't create the account. Check the email and try again."; exit 1; fi
  curl -s -o /dev/null "$URL/auth/v1/admin/users/$ID" -X PUT -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" -d "$BODY"
fi

supabase db query --linked "insert into public.admins (user_id) values ('$ID') on conflict do nothing;" >/dev/null
echo "Done. $EMAIL is an admin. Sign in with \"Admin sign-in\" at the bottom of the site."
