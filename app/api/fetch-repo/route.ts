import { NextResponse } from "next/server";

type GitHubItem = {
  type: "file" | "dir";
  path: string;
  download_url: string | null;
};

const ALLOWED_EXTENSIONS = [
  ".js", ".ts", ".jsx", ".tsx",
  ".py", ".java", ".go", ".cpp",
  ".c", ".md", ".json", ".yml"
];

async function fetchDir(
  owner: string,
  repo: string,
  path = ""
): Promise<{ path: string; content: string }[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  );

  if (!res.ok) throw new Error("Failed to fetch repo");

  const items: GitHubItem[] = await res.json();
  let files: { path: string; content: string }[] = [];

  for (const item of items) {
    if (item.type === "dir") {
      files.push(...await fetchDir(owner, repo, item.path));
    }

    if (
      item.type === "file" &&
      item.download_url &&
      ALLOWED_EXTENSIONS.some(ext => item.path.endsWith(ext))
    ) {
      const raw = await fetch(item.download_url).then(r => r.text());
      files.push({ path: item.path, content: raw });
    }
  }

  return files;
}

export async function POST(req: Request) {
  try {
    const { repoUrl } = await req.json();

    const match = repoUrl.match(
      /github\.com\/([^/]+)\/([^/]+)/
    );
    if (!match) {
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 }
      );
    }

    const [, owner, repo] = match;

    const files = await fetchDir(owner, repo);

    return NextResponse.json({
      repo: `${owner}/${repo}`,
      fileCount: files.length,
      files
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
