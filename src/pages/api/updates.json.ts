// 定义类型以增强类型安全
type RepoInfo = {
  label: string;
  owner: string;
  repo: string;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author?: {
    login?: string;
  };
};

type RepoResult = {
  repo: string;
  label: string;
  commits?: Array<{
    repo: string;
    label: string;
    sha: string;
    message: string;
    url: string;
    author: string | null;
    date: string | null;
  }>;
  error?: string;
};

export async function GET() {
  // Repositories to pull commits from
  const repos: RepoInfo[] = [
    { label: 'docs.tncrr.us.kg', owner: 'nczxe', repo: 'astro-kb-lu' },
    { label: 'tncrr.us.kg', owner: 'nczxe', repo: 'astro-blog-lu' },
  ];

  // 使用Cloudflare Workers环境变量而不是process.env
  // 在Cloudflare Workers中，环境变量应该通过绑定访问
  // 但为了兼容本地开发，保留process.env作为备选
  const githubToken = (process && process.env && process.env.GITHUB_TOKEN) || '';
  const headers: Record<string, string> = {
    'User-Agent': 'site-updates-fetcher',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  // 添加超时功能，避免长时间运行
  const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const results: RepoResult[] = [];
  for (const r of repos) {
    try {
      const url = `https://api.github.com/repos/${r.owner}/${r.repo}/commits?per_page=6`;
      // 设置10秒超时，避免Worker运行时间过长
      const resp = await withTimeout(fetch(url, { headers }), 10000);
      
      if (!resp.ok) {
        console.warn(`GitHub API error for ${r.repo}: ${resp.status}`);
        results.push({ repo: r.repo, label: r.label, error: `GitHub API ${resp.status}` });
        continue;
      }
      
      const commits: GitHubCommit[] = await resp.json();
      const items = (commits || []).map((c) => ({
        repo: r.repo,
        label: r.label,
        sha: c.sha,
        message: c.commit?.message ?? '',
        url: c.html_url,
        author: c.commit?.author?.name ?? c.author?.login ?? null,
        date: c.commit?.author?.date ?? null,
      }));
      results.push({ repo: r.repo, label: r.label, commits: items });
    } catch (err) {
      console.error(`Error fetching commits for ${r.repo}:`, err);
      results.push({ 
        repo: r.repo, 
        label: r.label, 
        error: err instanceof Error ? err.message : String(err) 
      });
    }
    // 添加延迟以避免触发GitHub API速率限制
    await delay(500);
  }

  return new Response(JSON.stringify({ updated: new Date().toISOString(), results }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
