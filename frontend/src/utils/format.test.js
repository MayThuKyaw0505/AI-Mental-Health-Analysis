import test from "node:test";
import assert from "node:assert/strict";
import { apiError } from "./format.js";

test("network failures give actionable feedback", () => {
  assert.match(apiError({}), /backend is running/);
});

test("timeouts acknowledge that a write may have completed", () => {
  assert.match(apiError({ code: "ECONNABORTED" }), /outcome may be unknown/);
});

test("server failures never echo database details or HTML", () => {
  for (const status of [500, 503]) {
    const result = apiError({
      response: {
        status,
        data: { detail: "fictional-private-database-value" },
      },
    });
    assert.doesNotMatch(result, /fictional-private/);
    assert.doesNotMatch(
      apiError({
        response: { status, data: "<html>technical traceback</html>" },
      }),
      /traceback|<html>/,
    );
  }
});

test("nested DRF field errors remain readable", () => {
  const result = apiError({
    response: {
      status: 400,
      data: { responses: [{ score: ["Use a score between 0 and 3."] }] },
    },
  });
  assert.match(result, /responses: Use a score between 0 and 3/);
  assert.doesNotMatch(result, /\[object Object\]/);
});

test("authentication, ownership, and missing records use safe messages", () => {
  assert.match(apiError({ response: { status: 401 } }), /sign in again/);
  assert.match(apiError({ response: { status: 403 } }), /permission/);
  assert.match(
    apiError({ response: { status: 404 } }),
    /not available to your account/,
  );
});

test("legacy error and detail messages do not get technical prefixes", () => {
  for (const field of ["detail", "error", "non_field_errors"]) {
    assert.equal(
      apiError({
        response: {
          status: 400,
          data: { [field]: "Please check your entry." },
        },
      }),
      "Please check your entry.",
    );
  }
});
