import { describe, it, expect, vi } from "vitest";
import {
  generateCourseDraft,
  assembleCourse,
  PROMPT_VERSION,
  type AnthropicLike,
  type LlmCourseOutput,
} from "@/lib/generate-course";

const validLesson = {
  rank: 1,
  title: "Anchors set the reference point",
  key_ideas: ["Anchor early", "Justify the number", "Leave room"],
  body_md: "## Anchors\n\nThe first number on the table sets the frame.",
  duration_min: 2,
};

const validQuiz = {
  rank: 1,
  prompt: "What is the role of an anchor?",
  choices: ["sets reference", "ends talks", "reveals weakness", "adds friction"],
  answer_index: 0,
  explanation: "The first number sets the reference point for the negotiation.",
};

const validOutput: LlmCourseOutput = {
  title: "Negotiating With Suppliers",
  tagline: "Lock better terms without burning the relationship.",
  topic: "business",
  description: "A 12-lesson course on supplier negotiation. Includes a 5-question capstone.",
  lessons: Array.from({ length: 12 }, (_, i) => ({ ...validLesson, rank: i + 1 })),
  quiz: Array.from({ length: 5 }, (_, i) => ({ ...validQuiz, rank: i + 1 })),
  duration_min: 18,
  cover_prompt: "Editorial photo of a handshake across a polished wooden table, golden hour light",
  intro_prompt: "Slow zoom over an open ledger, ink pen rolling slightly",
};

function makeClient(responses: (string | Error)[]): AnthropicLike {
  let i = 0;
  return {
    messages: {
      create: vi.fn().mockImplementation(async () => {
        const next = responses[i++];
        if (next instanceof Error) throw next;
        return { content: [{ type: "text", text: next }] };
      }),
    },
  };
}

describe("generateCourseDraft", () => {
  it("returns parsed LlmCourseOutput when client returns valid JSON", async () => {
    const client = makeClient([JSON.stringify(validOutput)]);
    const out = await generateCourseDraft({ topic: "supplier negotiation", client });
    expect(out.title).toBe("Negotiating With Suppliers");
    expect(out.lessons).toHaveLength(12);
    expect(out.quiz).toHaveLength(5);
  });

  it("handles ```json fenced output", async () => {
    const client = makeClient(["```json\n" + JSON.stringify(validOutput) + "\n```"]);
    const out = await generateCourseDraft({ topic: "x", client });
    expect(out.title).toBe(validOutput.title);
  });

  it("retries ONCE on invalid JSON, then succeeds", async () => {
    const client = makeClient(["this is not json", JSON.stringify(validOutput)]);
    const out = await generateCourseDraft({ topic: "x", client });
    expect(out.title).toBe(validOutput.title);
    expect(client.messages.create).toHaveBeenCalledTimes(2);
  });

  it("retries once on schema-mismatch, then succeeds", async () => {
    const bad = { ...validOutput, lessons: validOutput.lessons.slice(0, 9) }; // 9 lessons fails min(10)
    const client = makeClient([JSON.stringify(bad), JSON.stringify(validOutput)]);
    const out = await generateCourseDraft({ topic: "x", client });
    expect(out.lessons).toHaveLength(12);
  });

  it("throws after second failure", async () => {
    const client = makeClient(["nope", "still nope"]);
    await expect(generateCourseDraft({ topic: "x", client })).rejects.toThrow();
  });

  it("includes dedupe list in user message", async () => {
    const create = vi.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(validOutput) }] });
    const client: AnthropicLike = { messages: { create } };
    await generateCourseDraft({
      topic: "x",
      recentTitles: [{ title: "Old Course", topic: "biz" }, { title: "Another", topic: "tech" }],
      client,
    });
    const call = create.mock.calls[0][0] as { messages: { content: string }[] };
    const userMsg = call.messages[0].content;
    expect(userMsg).toContain("Old Course");
    expect(userMsg).toContain("Another");
  });
});

describe("assembleCourse", () => {
  it("produces a valid Course with discriminator + system fields", () => {
    const course = assembleCourse(validOutput, {
      date: "2026-06-17",
      run_id: "01HZ-test",
      model: "claude-sonnet-4-6",
    });
    expect(course.app).toBe("cad");
    expect(course.kind).toBe("course");
    expect(course._id).toBe("cad-2026-06-17");
    expect(course.slug).toBe("cad-2026-06-17");
    expect(course.meta.prompt_version).toBe(PROMPT_VERSION);
  });
});
