import http from "k6/http";
import { check, fail, sleep } from "k6";

import {
  getAuthToken,
  getBaseUrl,
  getCommonParams,
  getRealm,
  getUserId,
} from "./lib/config.js";

const baseUrl = getBaseUrl();
const token = getAuthToken();
const realm = getRealm();
const userId = getUserId();
const params = getCommonParams();

if (!token) {
  fail("K6_AUTH_TOKEN is required for authenticated-api.js");
}

if (!realm) {
  fail("K6_REALM is required for authenticated-api.js");
}

export const options = {
  scenarios: (() => {
    const scenarios = {
      users_list: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_USERS_RATE || 5),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "usersListScenario",
        tags: { endpoint_group: "org_manager_users" },
      },
    };

    if (userId) {
      scenarios.user_details = {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_USER_DETAILS_RATE || 3),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "userDetailsScenario",
        tags: { endpoint_group: "org_manager_user_details" },
      };
    }

    return scenarios;
  })(),
  thresholds: {
    "http_req_duration{scenario:users_list}": ["p(95)<500"],
    "http_req_duration{scenario:user_details}": ["p(95)<500"],
    checks: ["rate>0.99"],
  },
};

export function usersListScenario() {
  const res = http.get(`${baseUrl}/api/org-manager/${encodeURIComponent(realm)}/users`, params);
  check(res, {
    "users list returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function userDetailsScenario() {
  if (!userId) {
    return;
  }

  const res = http.get(
    `${baseUrl}/api/org-manager/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}`,
    params
  );
  check(res, {
    "user details returned 200": (r) => r.status === 200,
  });
  sleep(1);
}
