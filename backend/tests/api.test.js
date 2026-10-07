/**
 * backend/tests/api.test.js
 * Automated test suite for SkillSphere API
 */

const { test, before, after, describe } = require("node:test");
const assert = require("node:assert");
const http = require("http");

// Set environment for test
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-1234567890";
process.env.PORT = "5099";

const server = require("../server");

const BASE_URL = "http://localhost:5099";

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOpts = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = http.request(url, reqOpts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe("SkillSphere Full Platform API Test Suite", () => {
  let clientToken, clientUser;
  let freelancerToken, freelancerUser;
  let projectId, proposalId, teamId, roleId, applicationId;

  before(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  after(() => {
    server.close();
  });

  test("1. Health Check Endpoint", async () => {
    const res = await request("/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "healthy");
  });

  test("2. Register Client and Freelancer Users", async () => {
    const rand = Date.now();
    const res1 = await request("/api/auth/register", { method: "POST" }, {
      name: "Alice Client",
      email: `alice_${rand}@example.com`,
      password: "password123",
      role: "instructor"
    });
    assert.strictEqual(res1.status, 201);
    clientToken = res1.body.data.token;
    clientUser = res1.body.data.user;

    const res2 = await request("/api/auth/register", { method: "POST" }, {
      name: "Bob Freelancer",
      email: `bob_${rand}@example.com`,
      password: "password123",
      role: "student"
    });
    assert.strictEqual(res2.status, 201);
    freelancerToken = res2.body.data.token;
    freelancerUser = res2.body.data.user;
  });

  test("3. Profile Edit and Persistence", async () => {
    const res = await request(
      "/api/auth/me",
      { method: "PUT", headers: { Authorization: `Bearer ${freelancerToken}` } },
      {
        bio: "Expert Full-Stack Developer",
        skills: ["React", "Node.js", "SQLite"],
        github_url: "https://github.com/bobfree"
      }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.user.bio, "Expert Full-Stack Developer");

    // Fetch public profile
    const pubRes = await request(`/api/users/${freelancerUser.id}`);
    assert.strictEqual(pubRes.status, 200);
    assert.strictEqual(pubRes.body.data.user.name, "Bob Freelancer");
  });

  test("4. Portfolio CRUD Operations", async () => {
    // Add item
    const addRes = await request(
      "/api/users/portfolio",
      { method: "POST", headers: { Authorization: `Bearer ${freelancerToken}` } },
      {
        title: "E-Commerce App",
        description: "Built with React and Node",
        technologies: "React, Express",
        project_url: "https://example.com"
      }
    );
    assert.strictEqual(addRes.status, 201);
    const itemId = addRes.body.data.item.id;

    // Fetch portfolio
    const listRes = await request(`/api/users/${freelancerUser.id}/portfolio`);
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.data.portfolio.length, 1);

    // Delete item
    const delRes = await request(
      `/api/users/portfolio/${itemId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${freelancerToken}` } }
    );
    assert.strictEqual(delRes.status, 200);
  });

  test("5. Post Freelance Project", async () => {
    const res = await request(
      "/api/freelance/projects",
      { method: "POST", headers: { Authorization: `Bearer ${clientToken}` } },
      {
        title: "Build Mobile Responsive Dashboard",
        description: "Looking for an experienced frontend developer to build an interactive dashboard UI in React.",
        category: "Web Development",
        budget_type: "fixed",
        min_budget: 15000,
        max_budget: 25000,
        skills_required: ["React", "CSS"]
      }
    );
    assert.strictEqual(res.status, 201);
    projectId = res.body.data.project.id;
  });

  test("6. Search & Filter Freelance Projects", async () => {
    const res = await request("/api/freelance/projects?search=Dashboard&category=Web%20Development");
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.projects.length >= 1);
  });

  test("7. Submit Proposal", async () => {
    const res = await request(
      `/api/freelance/projects/${projectId}/proposals`,
      { method: "POST", headers: { Authorization: `Bearer ${freelancerToken}` } },
      {
        cover_letter: "I have 5 years of React experience and can deliver this dashboard within 5 days with high code quality.",
        proposed_price: 20000,
        estimated_delivery_time: "5 Days"
      }
    );
    assert.strictEqual(res.status, 201);
    proposalId = res.body.data.proposal.id;
  });

  test("8. Prevent Duplicate Proposal Submission", async () => {
    const res = await request(
      `/api/freelance/projects/${projectId}/proposals`,
      { method: "POST", headers: { Authorization: `Bearer ${freelancerToken}` } },
      {
        cover_letter: "Duplicate proposal attempt",
        proposed_price: 20000,
        estimated_delivery_time: "5 Days"
      }
    );
    assert.strictEqual(res.status, 400);
  });

  test("9. Accept Proposal and Hire Freelancer", async () => {
    const res = await request(
      `/api/freelance/proposals/${proposalId}/accept`,
      { method: "PATCH", headers: { Authorization: `Bearer ${clientToken}` } }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.conversation_id);

    // Verify project status is IN_PROGRESS
    const projRes = await request(`/api/freelance/projects/${projectId}`);
    assert.strictEqual(projRes.body.data.project.status, "IN_PROGRESS");
    assert.strictEqual(projRes.body.data.project.freelancer_id, freelancerUser.id);
  });

  test("10. Submit Work and Complete Project", async () => {
    // Work submission
    const subRes = await request(
      `/api/freelance/projects/${projectId}/submissions`,
      { method: "POST", headers: { Authorization: `Bearer ${freelancerToken}` } },
      {
        description: "Completed the dashboard with all responsive layouts and clean React components."
      }
    );
    assert.strictEqual(subRes.status, 201);

    // Client accepts work
    const compRes = await request(
      `/api/freelance/projects/${projectId}/complete`,
      { method: "PATCH", headers: { Authorization: `Bearer ${clientToken}` } },
      { action: "ACCEPT" }
    );
    assert.strictEqual(compRes.status, 200);

    // Verify project status is COMPLETED
    const finalProj = await request(`/api/freelance/projects/${projectId}`);
    assert.strictEqual(finalProj.body.data.project.status, "COMPLETED");
  });

  test("11. Messaging APIs & Conversations", async () => {
    // Get user conversations
    const convRes = await request(
      "/api/messaging/conversations",
      { headers: { Authorization: `Bearer ${clientToken}` } }
    );
    assert.strictEqual(convRes.status, 200);
    assert.ok(convRes.body.data.conversations.length >= 1);
    const convId = convRes.body.data.conversations[0].id;

    // Send message
    const msgRes = await request(
      `/api/messaging/conversations/${convId}/messages`,
      { method: "POST", headers: { Authorization: `Bearer ${clientToken}` } },
      { text: "Great work on the dashboard project!" }
    );
    assert.strictEqual(msgRes.status, 201);

    // Fetch message history
    const histRes = await request(
      `/api/messaging/conversations/${convId}/messages`,
      { headers: { Authorization: `Bearer ${freelancerToken}` } }
    );
    assert.strictEqual(histRes.status, 200);
    assert.strictEqual(histRes.body.data.messages.length, 1);
  });

  test("12. Notifications API", async () => {
    const notifRes = await request(
      "/api/notifications",
      { headers: { Authorization: `Bearer ${freelancerToken}` } }
    );
    assert.strictEqual(notifRes.status, 200);
    assert.ok(notifRes.body.data.notifications.length >= 1);

    // Read all
    const readAllRes = await request(
      "/api/notifications/read-all",
      { method: "PATCH", headers: { Authorization: `Bearer ${freelancerToken}` } }
    );
    assert.strictEqual(readAllRes.status, 200);
  });

  test("13. Team Finder - Create Project & Roles", async () => {
    const res = await request(
      "/api/teams",
      { method: "POST", headers: { Authorization: `Bearer ${freelancerToken}` } },
      {
        title: "AI Study Group & App",
        description: "Building a collaborative AI learning tool for students.",
        category: "Artificial Intelligence",
        member_limit: 4,
        roles: [
          { role_name: "Frontend Developer", description: "React UI", slots_total: 1 },
          { role_name: "Backend Developer", description: "Node.js API", slots_total: 1 }
        ]
      }
    );
    assert.strictEqual(res.status, 201);
    teamId = res.body.data.team.id;
    roleId = res.body.data.roles[0].id;
  });

  test("14. Team Finder - Apply & Accept Application", async () => {
    // Client user applies to role
    const appRes = await request(
      `/api/teams/${teamId}/apply`,
      { method: "POST", headers: { Authorization: `Bearer ${clientToken}` } },
      {
        role_id: roleId,
        introduction: "I love building clean UIs in React and would love to join this AI project."
      }
    );
    assert.strictEqual(appRes.status, 201);
    applicationId = appRes.body.data.application.id;

    // Team owner accepts application
    const acceptRes = await request(
      `/api/teams/applications/${applicationId}/accept`,
      { method: "PATCH", headers: { Authorization: `Bearer ${freelancerToken}` } }
    );
    assert.strictEqual(acceptRes.status, 200);

    // Verify team members
    const teamDetails = await request(`/api/teams/${teamId}`);
    assert.strictEqual(teamDetails.body.data.members.length, 2);
  });

  test("15. Workshop & Booking Regression Test", async () => {
    // Create workshop
    const wsRes = await request(
      "/api/workshops",
      { method: "POST", headers: { Authorization: `Bearer ${clientToken}` } },
      {
        title: "Node.js Architecture Masterclass",
        description: "Learn advanced Node.js backend patterns.",
        category: "Programming",
        price: 499,
        capacity: 10,
        mode: "online",
        status: "published"
      }
    );
    assert.strictEqual(wsRes.status, 201);
    const workshopId = wsRes.body.data.id;

    // Book workshop
    const bookRes = await request(
      "/api/bookings",
      { method: "POST", headers: { Authorization: `Bearer ${freelancerToken}` } },
      { workshop_id: workshopId }
    );
    assert.strictEqual(bookRes.status, 201);
  });
});
