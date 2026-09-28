import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// The home directory on this machine carries a stray pnpm lockfile, so Next
	// would otherwise infer /Users/... as the workspace root and trace files
	// from the wrong tree. Pin it to this repo.
	outputFileTracingRoot: __dirname,
	// Content is read from `content/**/*.md` by route handlers (`/raw/<slug>`,
	// `/llms.txt`) as well as by the build. The tracing list keeps those files
	// in a traced output; without it a bundled deployment ships the handlers
	// but not the markdown they serve.
	outputFileTracingIncludes: {
		"/**": ["./content/**/*.md"],
	},
};

export default nextConfig;
