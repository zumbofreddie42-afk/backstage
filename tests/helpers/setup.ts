// Tests run against the in-memory store, in preview mode, with no external services.
process.env.BACKSTAGE_STORE = "memory";
delete process.env.SITE_MODE;
delete process.env.RESEND_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
