import http from "k6/http";
import { check, fail, sleep } from "k6";

import {
  getAuthToken,
  getBaseUrl,
  getCommonParams,
  getCourseId,
  getUserId,
} from "./lib/config.js";

const baseUrl = getBaseUrl();
const token = getAuthToken();
const userId = getUserId();
const courseId = getCourseId();
const params = getCommonParams();

if (!token) {
  fail("K6_AUTH_TOKEN is required for base-user.js");
}

if (!userId) {
  fail("K6_USER_ID is required for base-user.js");
}

export const options = {
  scenarios: (() => {
    const scenarios = {
      current_user: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_PROFILE_RATE || 5),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "currentUserScenario",
        tags: { endpoint_group: "base_user_profile" },
      },
      enrolled_courses: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_ENROLLED_RATE || 5),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "enrolledCoursesScenario",
        tags: { endpoint_group: "base_user_courses" },
      },
      progress_list: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_PROGRESS_RATE || 5),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "progressListScenario",
        tags: { endpoint_group: "base_user_progress" },
      },
      certificates: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_CERTIFICATES_RATE || 3),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "certificatesScenario",
        tags: { endpoint_group: "base_user_certificates" },
      },
      my_stats: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_ME_STATS_RATE || 3),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "myStatsScenario",
        tags: { endpoint_group: "base_user_campaign_stats" },
      },
      compliance_status: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_COMPLIANCE_RATE || 3),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "complianceStatusScenario",
        tags: { endpoint_group: "base_user_compliance" },
      },
      compliance_doc: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_COMPLIANCE_DOC_RATE || 2),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "complianceLatestScenario",
        tags: { endpoint_group: "base_user_compliance" },
      },
      compliance_quiz: {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_COMPLIANCE_QUIZ_RATE || 2),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "complianceQuizScenario",
        tags: { endpoint_group: "base_user_compliance" },
      },
    };

    if (courseId) {
      scenarios.course_progress = {
        executor: "constant-arrival-rate",
        rate: Number(__ENV.K6_COURSE_PROGRESS_RATE || 3),
        timeUnit: "1s",
        duration: __ENV.K6_DURATION || "1m",
        preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 5),
        maxVUs: Number(__ENV.K6_MAX_VUS || 20),
        exec: "courseProgressScenario",
        tags: { endpoint_group: "base_user_progress_detail" },
      };
    }

    return scenarios;
  })(),
  thresholds: {
    "http_req_duration{scenario:current_user}": ["p(95)<300"],
    "http_req_duration{scenario:enrolled_courses}": ["p(95)<500"],
    "http_req_duration{scenario:progress_list}": ["p(95)<500"],
    "http_req_duration{scenario:course_progress}": ["p(95)<500"],
    "http_req_duration{scenario:certificates}": ["p(95)<500"],
    "http_req_duration{scenario:my_stats}": ["p(95)<500"],
    "http_req_duration{scenario:compliance_status}": ["p(95)<500"],
    "http_req_duration{scenario:compliance_doc}": ["p(95)<500"],
    "http_req_duration{scenario:compliance_quiz}": ["p(95)<500"],
    checks: ["rate>0.99"],
  },
};

export function currentUserScenario() {
  const res = http.get(`${baseUrl}/api/users/me`, params);
  check(res, {
    "users/me returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function enrolledCoursesScenario() {
  const res = http.get(
    `${baseUrl}/api/courses/${encodeURIComponent(userId)}/enrolled?exclude_scheduled=true`,
    params
  );
  check(res, {
    "enrolled courses returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function progressListScenario() {
  const res = http.get(
    `${baseUrl}/api/users/${encodeURIComponent(userId)}/progress?exclude_scheduled=true`,
    params
  );
  check(res, {
    "progress list returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function courseProgressScenario() {
  if (!courseId) return;

  const res = http.get(
    `${baseUrl}/api/users/${encodeURIComponent(userId)}/progress/${encodeURIComponent(courseId)}`,
    params
  );
  check(res, {
    "course progress returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function certificatesScenario() {
  const res = http.get(`${baseUrl}/api/users/me/certificates`, params);
  check(res, {
    "certificates returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function myStatsScenario() {
  const res = http.get(`${baseUrl}/api/campaigns/user/me/stats`, params);
  check(res, {
    "my stats returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function complianceStatusScenario() {
  const res = http.get(`${baseUrl}/api/compliance/status`, params);
  check(res, {
    "compliance status returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function complianceLatestScenario() {
  const res = http.get(`${baseUrl}/api/compliance/latest`, params);
  check(res, {
    "compliance latest returned 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function complianceQuizScenario() {
  const res = http.get(`${baseUrl}/api/compliance/latest/quiz`, params);
  check(res, {
    "compliance quiz returned 200": (r) => r.status === 200,
  });
  sleep(1);
}
