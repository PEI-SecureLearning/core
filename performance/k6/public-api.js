import http from "k6/http";
import { check, sleep } from "k6";

import { getBaseUrl, getCommonParams, getLookupDomain } from "./lib/config.js";

const baseUrl = getBaseUrl();
const params = getCommonParams();
const lookupDomain = encodeURIComponent(getLookupDomain());

export const options = {
  scenarios: {
    health: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 10 },
        { duration: "30s", target: 0 },
      ],
      exec: "healthScenario",
      tags: { endpoint_group: "health" },
    },
    realm_lookup: {
      executor: "ramping-vus",
      startTime: "5s",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 10 },
        { duration: "30s", target: 0 },
      ],
      exec: "realmLookupScenario",
      tags: { endpoint_group: "realm_lookup" },
    },
  },
  thresholds: {
    "http_req_duration{scenario:health}": ["p(95)<200"],
    "http_req_duration{scenario:realm_lookup}": ["p(95)<250"],
    checks: ["rate>0.99"],
  },
};

export function healthScenario() {
  const res = http.get(`${baseUrl}/health`, params);
  check(res, {
    "health returned 200": (r) => r.status === 200,
    "health status ok": (r) => r.json("status") === "ok",
  });
  sleep(1);
}

export function realmLookupScenario() {
  const res = http.get(`${baseUrl}/api/realms?domain=${lookupDomain}`, params);
  check(res, {
    "realm lookup returned 200 or 404": (r) => r.status === 200 || r.status === 404,
  });
  sleep(1);
}
