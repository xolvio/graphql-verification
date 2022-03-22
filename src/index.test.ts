import { describe, expect, test } from "@jest/globals";
import { createVerificationRules } from "./index.js";

describe("createVerificationRules", () => {
  test("works", () => {
    const schema = `
      type Test {
        id: ID!
      }
    `;
    const verificationRules = createVerificationRules(schema);
    console.log(verificationRules);
    expect(verificationRules).toEqual([
      {
        verify: expect.any(Function),
        failMessage: 'Type "Test" missing.',
      },
      {
        verify: expect.any(Function),
        failMessage: 'On type "Test": field "id" missing.',
      },
      {
        verify: expect.any(Function),
        failMessage:
          'On type "Test": field "id" has a different type than "ID!".',
      },
    ]);
  });
});
