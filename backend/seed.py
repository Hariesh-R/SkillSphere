import json, subprocess, sys

BASE = "http://localhost:5000"

def req(method, path, *, token=None, json_body=None, form=None):
    cmd = ["curl", "-s", "-X", method, f"{BASE}{path}"]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if json_body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(json_body)]
    if form:
        for k, v in form.items():
            cmd += ["-F", f"{k}={v}"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(result.stdout)
    except:
        return {}

print("Seeding database...")

# 1. Instructors
r1 = req("POST", "/api/auth/register", json_body={"name":"Alice Instructor", "email":"alice@example.com", "password":"password123", "role":"instructor"})
token_alice = r1.get("data", {}).get("token", "")

r2 = req("POST", "/api/auth/register", json_body={"name":"Bob Teacher", "email":"bob@example.com", "password":"password123", "role":"instructor"})
token_bob = r2.get("data", {}).get("token", "")

# 2. Students
r3 = req("POST", "/api/auth/register", json_body={"name":"Student Sam", "email":"sam@example.com", "password":"password123", "role":"student"})
token_sam = r3.get("data", {}).get("token", "")

r4 = req("POST", "/api/auth/register", json_body={"name":"Student Sue", "email":"sue@example.com", "password":"password123", "role":"student"})
token_sue = r4.get("data", {}).get("token", "")

# 3. Workshops
if token_alice:
    w1 = req("POST", "/api/workshops", token=token_alice, form={
        "title":"Advanced React Patterns",
        "description":"Master React by building scalable applications.",
        "category":"Programming",
        "skill_level":"advanced",
        "mode":"online",
        "price":"999",
        "capacity":"50",
        "status":"published",
        "schedule":"2026-10-15T10:00:00Z"
    })
    wid1 = w1.get("data",{}).get("id")

if token_bob:
    w2 = req("POST", "/api/workshops", token=token_bob, form={
        "title":"UI/UX Design Fundamentals",
        "description":"Learn the basics of Figma and design theory.",
        "category":"Design",
        "skill_level":"beginner",
        "mode":"offline",
        "price":"500",
        "capacity":"20",
        "status":"published",
        "schedule":"2026-11-01T14:00:00Z",
        "location":"123 Main St, Tech Hub"
    })
    wid2 = w2.get("data",{}).get("id")

# 4. Bookings & Reviews
if token_sam and wid1:
    req("POST", "/api/bookings", token=token_sam, json_body={"workshop_id": wid1})
    req("POST", f"/api/workshops/{wid1}/reviews", token=token_sam, json_body={"rating":5, "comment":"Excellent course!"})

if token_sue and wid1:
    req("POST", "/api/bookings", token=token_sue, json_body={"workshop_id": wid1})
    req("POST", f"/api/workshops/{wid1}/reviews", token=token_sue, json_body={"rating":4, "comment":"Very detailed, but moving fast."})

if token_sam and wid2:
    req("POST", "/api/bookings", token=token_sam, json_body={"workshop_id": wid2})

print("✅ Seeding complete.")
print("Demo Accounts:")
print("Instructor: alice@example.com / password123")
print("Instructor: bob@example.com / password123")
print("Student: sam@example.com / password123")
print("Student: sue@example.com / password123")

