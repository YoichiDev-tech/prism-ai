import type { Tool } from "./types";

// READ-ONLY GitHub tools. The token lives only in server env vars
// (GITHUB_TOKEN) and is never sent to the model or the browser.
const GITHUB_API = "https://api.github.com";

// Default owner so the model can say "PrismWave-Studio" instead of the full path.
const OWNER = process.env.GITHUB_OWNER || "YoichiDev-tech";

// Keep results small so they fit the model's context window.
const MAX_FILE_CHARS = 12000;

// Single place that talks to GitHub. Throws readable errors the model can relay.
async function githubFetch(path: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set on the server.");

  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub API error (${response.status}) for ${path}`);
  }
  return response.json();
}

// Pull a required string argument out of what the model sent.
function str(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing required argument: ${key}`);
  }
  return value;
}

// Only allow simple repo names — blocks path tricks like "../".
function repoName(args: Record<string, unknown>): string {
  const repo = str(args, "repo");
  if (!/^[A-Za-z0-9._-]+$/.test(repo)) throw new Error("Invalid repo name.");
  return repo;
}

export const githubTools: Record<string, Tool> = {
  github_list_repos: {
    definition: {
      type: "function",
      function: {
        name: "github_list_repos",
        description: "List the GitHub repositories the assistant has access to.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    run: async () => {
      const repos = (await githubFetch(
        "/user/repos?per_page=50&sort=updated"
      )) as Array<{ name: string; description: string | null; private: boolean; updated_at: string }>;
      return JSON.stringify(
        repos.map((r) => ({
          name: r.name,
          description: r.description,
          private: r.private,
          updated_at: r.updated_at,
        }))
      );
    },
  },

  github_list_files: {
    definition: {
      type: "function",
      function: {
        name: "github_list_files",
        description:
          "List files and folders at a path inside a repository (empty path = repo root).",
        parameters: {
          type: "object",
          properties: {
            repo: { type: "string", description: "Repository name, e.g. PrismWave-Studio" },
            path: { type: "string", description: "Folder path inside the repo. Use empty string for root." },
          },
          required: ["repo"],
        },
      },
    },
    run: async (args) => {
      const repo = repoName(args);
      const path = typeof args.path === "string" ? args.path.replace(/^\/+/, "") : "";
      const items = (await githubFetch(
        `/repos/${OWNER}/${repo}/contents/${encodeURI(path)}`
      )) as Array<{ name: string; type: string }> | { name: string; type: string };
      const list = Array.isArray(items) ? items : [items];
      return JSON.stringify(list.map((i) => ({ name: i.name, type: i.type })));
    },
  },

  github_read_file: {
    definition: {
      type: "function",
      function: {
        name: "github_read_file",
        description: "Read the text content of one file in a repository.",
        parameters: {
          type: "object",
          properties: {
            repo: { type: "string", description: "Repository name, e.g. PrismWave-Studio" },
            path: { type: "string", description: "File path, e.g. src/App.tsx or README.md" },
          },
          required: ["repo", "path"],
        },
      },
    },
    run: async (args) => {
      const repo = repoName(args);
      const path = str(args, "path").replace(/^\/+/, "");
      const file = (await githubFetch(
        `/repos/${OWNER}/${repo}/contents/${encodeURI(path)}`
      )) as { content?: string; encoding?: string; type?: string };

      if (file.type !== "file" || !file.content) {
        throw new Error("That path is not a readable file.");
      }
      const text = Buffer.from(file.content, "base64").toString("utf-8");
      return text.length > MAX_FILE_CHARS
        ? text.slice(0, MAX_FILE_CHARS) + "\n...[truncated]"
        : text;
    },
  },

  github_list_issues: {
    definition: {
      type: "function",
      function: {
        name: "github_list_issues",
        description: "List open issues of a repository.",
        parameters: {
          type: "object",
          properties: {
            repo: { type: "string", description: "Repository name, e.g. PrismWave-Studio" },
          },
          required: ["repo"],
        },
      },
    },
    run: async (args) => {
      const repo = repoName(args);
      const issues = (await githubFetch(
        `/repos/${OWNER}/${repo}/issues?state=open&per_page=20`
      )) as Array<{ number: number; title: string; pull_request?: unknown }>;
      // GitHub returns PRs in this endpoint too — keep real issues only.
      return JSON.stringify(
        issues.filter((i) => !i.pull_request).map((i) => ({ number: i.number, title: i.title }))
      );
    },
  },
};