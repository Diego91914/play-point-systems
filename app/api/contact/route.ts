import { NextResponse } from "next/server";
import { createSupabaseSqlRunnerFromEnv } from "@/lib/play-point-core/supabase-sql-runner";

type ContactSubmission = {
  kind?: string;
  name?: string;
  email?: string;
  topic?: string;
  product?: string;
  message?: string;
  company?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function hasDatabaseConfiguration() {
  return Boolean(
    process.env.PLAY_POINT_LIVE_DATABASE_URL ??
      process.env.SUPABASE_DB_URL ??
      process.env.DATABASE_URL,
  );
}

async function storeSubmission(submission: Required<Omit<ContactSubmission, "company">>) {
  const runner = createSupabaseSqlRunnerFromEnv();

  await runner.query(`
    create table if not exists pps_contact_submissions (
      id uuid primary key default gen_random_uuid(),
      kind text not null,
      name text not null,
      email text not null,
      topic text not null,
      product text not null,
      message text not null,
      status text not null default 'new',
      created_at timestamptz not null default now()
    )
  `);

  await runner.query(
    `insert into pps_contact_submissions (kind, name, email, topic, product, message)
     values ($1, $2, $3, $4, $5, $6)`,
    [submission.kind, submission.name, submission.email, submission.topic, submission.product, submission.message],
  );
}

async function sendSubmission(submission: Required<Omit<ContactSubmission, "company">>) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const recipient = process.env.CONTACT_TO_EMAIL?.trim() || "channing@playpointsystems.com";
  const sender = process.env.CONTACT_FROM_EMAIL?.trim() || "Play Point Systems <onboarding@resend.dev>";
  const subject = `[${submission.kind === "support" ? "Support" : "Contact"}] ${submission.topic} - ${submission.product}`;
  const text = [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Topic: ${submission.topic}`,
    `Product: ${submission.product}`,
    "",
    submission.message,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: sender, to: [recipient], reply_to: submission.email, subject, text }),
  });

  if (!response.ok) {
    throw new Error("The configured email delivery service rejected the submission.");
  }

  return true;
}

export async function POST(request: Request) {
  let body: ContactSubmission;

  try {
    body = (await request.json()) as ContactSubmission;
  } catch {
    return NextResponse.json({ sent: false, error: "A valid form submission is required." }, { status: 400 });
  }

  if (clean(body.company, 120)) {
    return NextResponse.json({ sent: true });
  }

  const submission = {
    kind: clean(body.kind, 20) === "support" ? "support" : "contact",
    name: clean(body.name, 100),
    email: clean(body.email, 180).toLowerCase(),
    topic: clean(body.topic, 100),
    product: clean(body.product, 100),
    message: clean(body.message, 4000),
  };

  if (!submission.name || !EMAIL_PATTERN.test(submission.email) || !submission.topic || !submission.product || submission.message.length < 10) {
    return NextResponse.json(
      { sent: false, error: "Complete every field and include a valid email and a message of at least 10 characters." },
      { status: 400 },
    );
  }

  try {
    const emailed = await sendSubmission(submission);
    let stored = false;

    if (hasDatabaseConfiguration()) {
      try {
        await storeSubmission(submission);
        stored = true;
      } catch (storageError) {
        if (!emailed) throw storageError;
        console.error("Contact submission was emailed but could not be stored:", storageError);
      }
    }

    if (!emailed && !stored) {
      return NextResponse.json(
        { sent: false, error: "Online delivery is not configured yet. Please use the direct email link below." },
        { status: 503 },
      );
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("POST /api/contact failed:", error);
    return NextResponse.json(
      { sent: false, error: "We could not deliver your message. Please use the direct email link below." },
      { status: 500 },
    );
  }
}
