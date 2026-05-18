import http from "k6/http";
import { check, fail } from "k6";
import exec from "k6/execution";
import { Counter, Rate, Trend } from "k6/metrics";

import { getAuthToken, getBaseUrl, getRealm, getCommonParams } from "./lib/config.js";

const baseUrl = getBaseUrl();
const token = getAuthToken();
const realm = getRealm();
const emailDomain = (__ENV.K6_BULK_EMAIL_DOMAIN || __ENV.K6_LOOKUP_DOMAIN || "").trim().toLowerCase();
const batchSize = Number(__ENV.K6_BULK_BATCH_SIZE || 10);
const userRole = (__ENV.K6_BULK_USER_ROLE || "DEFAULT_USER").trim().toUpperCase();
const usernamePrefix = (__ENV.K6_BULK_USERNAME_PREFIX || "k6bulk").trim().toLowerCase();
const groupId = (__ENV.K6_BULK_GROUP_ID || "").trim();
const createParams = getCommonParams({ "Content-Type": "application/json" });

const batchDuration = new Trend("bulk_user_create_batch_duration", true);
const usersCreated = new Counter("bulk_users_created_total");
const usersFailed = new Counter("bulk_users_failed_total");
const creationSuccess = new Rate("bulk_user_create_success_rate");

if (!token) {
  fail("K6_AUTH_TOKEN is required for bulk-user-create.js");
}

if (!realm) {
  fail("K6_REALM is required for bulk-user-create.js");
}

if (!emailDomain) {
  fail("K6_BULK_EMAIL_DOMAIN is required for bulk-user-create.js");
}

if (!Number.isFinite(batchSize) || batchSize < 1) {
  fail("K6_BULK_BATCH_SIZE must be a positive integer");
}

export const options = {
  scenarios: {
    bulk_user_create: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.K6_BULK_CREATE_RATE || 1),
      timeUnit: "1s",
      duration: __ENV.K6_DURATION || "1m",
      preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
      maxVUs: Number(__ENV.K6_MAX_VUS || 20),
      exec: "bulkUserCreateScenario",
      tags: { endpoint_group: "org_manager_bulk_user_create" },
    },
  },
  thresholds: {
    "http_req_duration{scenario:bulk_user_create}": ["p(95)<1000"],
    bulk_user_create_batch_duration: ["p(95)<10000"],
    bulk_user_create_success_rate: ["rate>0.99"],
    checks: ["rate>0.99"],
  },
};

function buildUserPayload(indexInBatch) {
  const vu = exec.vu.idInTest;
  const iter = exec.scenario.iterationInTest;
  const stamp = Date.now().toString(36);
  const suffix = `${vu}${iter}${indexInBatch}${stamp}`.slice(-16);
  const username = `${usernamePrefix}${suffix}`.slice(0, 40);

  return {
    username,
    name: `K6 Bulk ${vu}-${iter}-${indexInBatch}`,
    email: `${username}@${emailDomain}`,
    role: userRole,
    ...(groupId ? { group_id: groupId } : {}),
  };
}

export function bulkUserCreateScenario() {
  const startedAt = Date.now();

  for (let i = 0; i < batchSize; i += 1) {
    const payload = buildUserPayload(i);
    const res = http.post(
      `${baseUrl}/api/realms/${encodeURIComponent(realm)}/users`,
      JSON.stringify(payload),
      createParams
    );

    const ok = check(res, {
      "bulk create returned 201": (r) => r.status === 201,
    });

    creationSuccess.add(ok);

    if (ok) {
      usersCreated.add(1);
    } else {
      usersFailed.add(1);
    }
  }

  batchDuration.add(Date.now() - startedAt);
}
