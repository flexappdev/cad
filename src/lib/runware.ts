// Runware FLUX (image) + Seedance (video) wrappers.
// Image model pinned to runware:100@1 — the default RUNWARE_DEFAULT_MODEL
// in the central env is bytedance:2@2 (video), which would silently
// produce video output for an image call.
//
// Endpoint: POST https://api.runware.ai/v1 — newline-delimited JSON
// of tasks. We use one task per call to keep it simple.

const IMAGE_MODEL = process.env.RUNWARE_IMAGE_MODEL ?? "runware:100@1";
const VIDEO_MODEL = process.env.RUNWARE_VIDEO_MODEL ?? "bytedance:2@2";

export interface ImageResult {
  url: string;
  cost: number;
  task_uuid: string;
  model: string;
}

export interface VideoResult extends ImageResult {
  duration: number;
}

type RunwareDataEntry = { imageURL?: string; videoURL?: string; cost?: number };
async function runwareCall(tasks: object[]): Promise<{ data?: RunwareDataEntry[]; errors?: unknown[] }> {
  if (!process.env.RUNWARE_API_KEY) {
    throw new Error("RUNWARE_API_KEY is not set");
  }
  const res = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify(tasks),
  });
  if (!res.ok) throw new Error(`Runware ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function genCoverImage(prompt: string): Promise<ImageResult> {
  const taskUUID = crypto.randomUUID();
  const body = await runwareCall([
    {
      taskType: "imageInference",
      taskUUID,
      positivePrompt: prompt,
      model: IMAGE_MODEL,
      width: 1024,
      height: 640, // 16:10 — good crop on hero cards
      numberResults: 1,
      outputFormat: "JPEG",
      outputType: "URL",
    },
  ]);
  const first = (body.data ?? [])[0];
  if (!first?.imageURL) {
    throw new Error(`Runware image gen failed: ${JSON.stringify(body.errors ?? body)}`);
  }
  return { url: first.imageURL, cost: first.cost ?? 0, task_uuid: taskUUID, model: IMAGE_MODEL };
}

export async function genIntroVideo(prompt: string): Promise<VideoResult> {
  const taskUUID = crypto.randomUUID();
  const body = await runwareCall([
    {
      taskType: "videoInference",
      taskUUID,
      positivePrompt: prompt,
      model: VIDEO_MODEL,
      width: 864,
      height: 480,
      duration: 5,
      numberResults: 1,
      outputFormat: "MP4",
      outputType: "URL",
    },
  ]);
  const first = (body.data ?? [])[0];
  if (!first?.videoURL) {
    throw new Error(`Runware video gen failed: ${JSON.stringify(body.errors ?? body)}`);
  }
  return {
    url: first.videoURL,
    cost: first.cost ?? 0,
    task_uuid: taskUUID,
    model: VIDEO_MODEL,
    duration: 5,
  };
}
