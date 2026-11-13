import { assert, assertEquals } from "jsr:@std/assert@1";
import { captionProblem, isOurAccount } from "./rules.ts";

Deno.test("captions can never mention AI, generation tools or 3D printing", () => {
  assert(captionProblem("Made with AI ✨"));
  assert(captionProblem("an AI-generated portrait"));
  assert(captionProblem("Created using Kling"));
  assert(captionProblem("3D printed just for you"));
  assertEquals(captionProblem("Meet Milo, cast in Sand with his name on the front. From $59."), null);
  assertEquals(captionProblem("Said hi to Kaia today"), null); // "ai" inside words is fine
});

Deno.test("posts never use urgency or countdown language", () => {
  assert(captionProblem("Only 3 left — hurry!"));
  assert(captionProblem("Last chance for holiday delivery"));
  assertEquals(captionProblem("For the pet person on your list."), null);
});

Deno.test("the ads helper can only pause objects in Nyzora's own ad account", () => {
  assert(isOurAccount("2036145687783794"));
  assert(isOurAccount("act_2036145687783794"));
  assertEquals(isOurAccount("123456789"), false);
  assertEquals(isOurAccount(undefined), false);
});
