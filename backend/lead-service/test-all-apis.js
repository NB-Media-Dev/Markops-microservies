import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 4004}`;
<<<<<<< HEAD
const DB_URL = process.env.DATABASE_URL || "mysql://root:Ratheesh@17@localhost:3303/telecaller_db";
=======
const DB_URL = process.env.DATABASE_URL || "mysql://root:Ratheesh@17@localhost:3303/telecaller_db";
>>>>>>> f1f6db5be22570188d950de5fa2d49d227647a47

async function runTestSuite() {
  console.log("==================================================================");
  console.log(" 🧪 MarkOps Lead & Telecalling Service - Full API & DB Test Suite");
  console.log(` 🌐 Testing API Server: ${BASE_URL}`);
  console.log(` 🗄️  Connecting to DB:  ${DB_URL}`);
  console.log("==================================================================\n");

  const conn = await mysql.createConnection(DB_URL);
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName, details = "") {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   └─ Details: ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Health Check API
    // -------------------------------------------------------------------------
    console.log("▶ 1. Testing GET /health ...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === "UP", "GET /health responds with 200 OK and status UP", `Service: ${healthData.service}, Database: ${healthData.database?.status}`);

    // -------------------------------------------------------------------------
    // TEST 2: POST /targets (Upsert Daily Target) & DB Verification
    // -------------------------------------------------------------------------
    console.log("\n▶ 2. Testing POST /targets (Save to DB) ...");
    const testTelecallerId = "telecaller_agent_99";
    const targetPayload = {
      telecaller_id: testTelecallerId,
      telecaller_name: "Ramesh Sharma",
      telecaller_email: "ramesh.sharma@markops.in",
      daily_calls_target: 45,
      daily_interested_target: 8,
      daily_duration_target_seconds: 4500,
      updated_by: "Test Admin"
    };

    const targetRes = await fetch(`${BASE_URL}/targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetPayload)
    });
    const targetData = await targetRes.json();
    assert(targetRes.status === 200 && targetData.success === true, "POST /targets returns 200 OK", targetData.message);

    // Verify in MySQL
    const [dbTargetRows] = await conn.query(
      "SELECT * FROM telecaller_targets WHERE telecaller_id = ?",
      [testTelecallerId]
    );
    assert(
      dbTargetRows.length === 1 && dbTargetRows[0].daily_calls_target === 45,
      "DB Check: Target verified in telecaller_targets table",
      `Saved: Name='${dbTargetRows[0]?.telecaller_name}', Target=${dbTargetRows[0]?.daily_calls_target} calls, Duration=${dbTargetRows[0]?.daily_duration_target_seconds}s`
    );

    // -------------------------------------------------------------------------
    // TEST 3: GET /targets & GET /targets/:id
    // -------------------------------------------------------------------------
    console.log("\n▶ 3. Testing GET /targets & GET /targets/:telecallerId ...");
    const allTargetsRes = await fetch(`${BASE_URL}/targets`);
    const allTargetsData = await allTargetsRes.json();
    assert(allTargetsRes.status === 200 && Array.isArray(allTargetsData.data), "GET /targets lists all targets", `Total targets configured: ${allTargetsData.count}`);

    const singleTargetRes = await fetch(`${BASE_URL}/targets/${testTelecallerId}`);
    const singleTargetData = await singleTargetRes.json();
    assert(singleTargetData.success === true && singleTargetData.data.telecallerId === testTelecallerId, "GET /targets/:id returns matching record", `Agent: ${singleTargetData.data.telecallerName}`);

    // -------------------------------------------------------------------------
    // TEST 4: PUT /targets/:id (Update Target)
    // -------------------------------------------------------------------------
    console.log("\n▶ 4. Testing PUT /targets/:telecallerId ...");
    const updateTargetRes = await fetch(`${BASE_URL}/targets/${testTelecallerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daily_calls_target: 55, daily_interested_target: 12 })
    });
    const updateTargetData = await updateTargetRes.json();
    assert(updateTargetRes.status === 200 && updateTargetData.success === true, "PUT /targets/:id updates target", `New Target: ${updateTargetData.data?.dailyCallsTarget}`);

    // -------------------------------------------------------------------------
    // TEST 5: POST /call-logs (Create Log, Save to DB & Auto-Update Leads)
    // -------------------------------------------------------------------------
    console.log("\n▶ 5. Testing POST /call-logs (Create Log & Auto-update lead) ...");
    
    const campaignDb = process.env.CAMPAIGN_DB || "digital_db";
    // Ensure test lead 1 exists in campaign database
    const [existingLeads] = await conn.query(`SELECT id FROM \`${campaignDb}\`.\`leads\` WHERE id = 1`);
    if (existingLeads.length === 0) {
      await conn.query(`INSERT INTO \`${campaignDb}\`.\`leads\` (id, first_name, last_name, phone, status) VALUES (1, 'Arun', 'Kumar', '+919876543210', 'NEW')`);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 19).replace('T', ' ');

    const callLogPayload = {
      lead_id: 1,
      telecaller_id: 99,
      call_outcome: "INTERESTED",
      duration_seconds: 240,
      call_remarks: "Customer requested high-priority product demo and pricing brochure.",
      follow_up_required: true,
      follow_up_time: tomorrowStr
    };

    const callLogRes = await fetch(`${BASE_URL}/call-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(callLogPayload)
    });
    const callLogData = await callLogRes.json();
    const createdCallLogId = callLogData.data?.id;

    assert(callLogRes.status === 201 && createdCallLogId > 0, "POST /call-logs created call log", `Created Call Log ID: #${createdCallLogId}`);

    // Verify Call Log in DB
    const [dbCallLogRows] = await conn.query("SELECT * FROM call_logs WHERE id = ?", [createdCallLogId]);
    assert(
      dbCallLogRows.length === 1 && dbCallLogRows[0].call_outcome === "INTERESTED",
      "DB Check: Call log persisted in 'call_logs' table",
      `Saved: Duration=${dbCallLogRows[0]?.duration_seconds}s, Remarks='${dbCallLogRows[0]?.call_remarks}'`
    );

    // Verify Auto-Sync on Campaign Database's Leads Table
    const [dbLeadRows] = await conn.query(`SELECT id, status, call_disposition FROM \`${campaignDb}\`.\`leads\` WHERE id = 1`);
    assert(
      dbLeadRows[0]?.call_disposition === "INTERESTED" && dbLeadRows[0]?.status === "INTERESTED",
      "DB Check: Campaign 'digital_db.leads' table auto-updated disposition and status",
      `Lead #1 Status='${dbLeadRows[0]?.status}', Call Disposition='${dbLeadRows[0]?.call_disposition}'`
    );

    // -------------------------------------------------------------------------
    // TEST 6: GET /call-logs & GET /call-logs/:id
    // -------------------------------------------------------------------------
    console.log("\n▶ 6. Testing GET /call-logs and GET /call-logs/:id ...");
    const listLogsRes = await fetch(`${BASE_URL}/call-logs?limit=5`);
    const listLogsData = await listLogsRes.json();
    assert(listLogsRes.status === 200 && listLogsData.success === true, "GET /call-logs returns paginated list", `Fetched: ${listLogsData.count} logs (Total: ${listLogsData.pagination?.total})`);

    const singleLogRes = await fetch(`${BASE_URL}/call-logs/${createdCallLogId}`);
    const singleLogData = await singleLogRes.json();
    assert(singleLogRes.status === 200 && singleLogData.data?.id === createdCallLogId, "GET /call-logs/:id retrieves exact call log with lead info", `Lead Name: ${singleLogData.data?.leadFirstName} ${singleLogData.data?.leadLastName}`);

    // -------------------------------------------------------------------------
    // TEST 7: PUT /call-logs/:id (Update Remarks)
    // -------------------------------------------------------------------------
    console.log("\n▶ 7. Testing PUT /call-logs/:id ...");
    const updateLogRes = await fetch(`${BASE_URL}/call-logs/${createdCallLogId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        call_remarks: "Updated: Client requested brochure via WhatsApp as well."
      })
    });
    const updateLogData = await updateLogRes.json();
    assert(updateLogRes.status === 200 && updateLogData.success === true, "PUT /call-logs/:id successfully updated remarks", updateLogData.data?.callRemarks);

    // -------------------------------------------------------------------------
    // TEST 8: GET /leads/:leadId/call-logs (History Timeline)
    // -------------------------------------------------------------------------
    console.log("\n▶ 8. Testing GET /leads/:leadId/call-logs ...");
    const leadHistoryRes = await fetch(`${BASE_URL}/leads/1/call-logs`);
    const leadHistoryData = await leadHistoryRes.json();
    assert(leadHistoryRes.status === 200 && leadHistoryData.success === true, "GET /leads/:leadId/call-logs returns lead timeline", `Total calls on Lead #1: ${leadHistoryData.count}`);

    // -------------------------------------------------------------------------
    // TEST 9: Follow-ups APIs (GET & PATCH complete)
    // -------------------------------------------------------------------------
    console.log("\n▶ 9. Testing Follow-ups APIs ...");
    const followUpsRes = await fetch(`${BASE_URL}/follow-ups?filter=ALL`);
    const followUpsData = await followUpsRes.json();
    assert(followUpsRes.status === 200 && followUpsData.success === true, "GET /follow-ups?filter=ALL lists pending reminders", `Pending follow-ups count: ${followUpsData.count}`);

    const completeRes = await fetch(`${BASE_URL}/follow-ups/${createdCallLogId}/complete`, {
      method: "PATCH"
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200 && completeData.success === true, "PATCH /follow-ups/:id/complete marks reminder completed", completeData.message);

    // DB verify follow-up completed
    const [completedDbRow] = await conn.query("SELECT follow_up_required FROM call_logs WHERE id = ?", [createdCallLogId]);
    assert(completedDbRow[0]?.follow_up_required === 0, "DB Check: follow_up_required set to 0 in DB");

    // -------------------------------------------------------------------------
    // TEST 10: Telecaller Live Progress Tracking
    // -------------------------------------------------------------------------
    console.log("\n▶ 10. Testing GET /targets/:id/progress (Live Tracker) ...");
    const progressRes = await fetch(`${BASE_URL}/targets/99/progress`);
    const progressData = await progressRes.json();
    assert(
      progressRes.status === 200 && progressData.success === true && progressData.data.calls !== undefined,
      "GET /targets/:id/progress calculates today's achievements",
      `Actual Calls Today: ${progressData.data.calls.actual}, Total Talk Time: ${progressData.data.duration.actualSeconds}s, Interested: ${progressData.data.interested.actual}`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Telecalling Analytics Dashboard Metrics
    // -------------------------------------------------------------------------
    console.log("\n▶ 11. Testing GET /telecalling/dashboard-metrics ...");
    const metricsRes = await fetch(`${BASE_URL}/telecalling/dashboard-metrics`);
    const metricsData = await metricsRes.json();
    assert(
      metricsRes.status === 200 && metricsData.success === true,
      "GET /telecalling/dashboard-metrics computes KPIs",
      `Total Calls Today: ${metricsData.data.today?.totalCalls}, Talk Time: ${metricsData.data.today?.totalDurationFormatted}, Conversion Rate: ${metricsData.data.today?.conversionRatePercent}%`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Telecalling Leaderboard
    // -------------------------------------------------------------------------
    console.log("\n▶ 12. Testing GET /telecalling/leaderboard ...");
    const lbRes = await fetch(`${BASE_URL}/telecalling/leaderboard`);
    const lbData = await lbRes.json();
    assert(
      lbRes.status === 200 && lbData.success === true && Array.isArray(lbData.data),
      "GET /telecalling/leaderboard ranks callers",
      `Top Telecallers on Leaderboard: ${lbData.data.length}`
    );

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(` 🏆 TEST SUITE RESULT: ${passedCount}/${totalCount} TESTS PASSED!`);
    console.log("==================================================================");

  } catch (error) {
    console.error("\n❌ Test execution encountered an exception:", error);
  } finally {
    await conn.end();
  }
}

runTestSuite();

