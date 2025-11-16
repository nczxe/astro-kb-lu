export async function GET() {
  // Repositories to pull commits from
  const repos = [
    { label: 'docs.tncrr.us.kg', owner: 'nczxe', repo: 'astro-kb-lu' },
    { label: 'tncrr.us.kg', owner: 'nczxe', repo: 'astro-blog-lu' },
  ];

  const githubToken = process.env.GITHUB_TOKEN || '';
  const headers: Record<string,string> = {
    'User-Agent': 'site-updates-fetcher',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (githubToken) headers['Authorization'] = `token ${githubToken}`;

  const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

  const results: Array<any> = [];
  for (const r of repos) {
    try {
      const url = `https://api.github.com/repos/${r.owner}/${r.repo}/commits?per_page=6`;
      const resp = await fetch(url, { headers });
      if (!resp.ok) {
        results.push({ repo: r.repo, label: r.label, error: `GitHub API ${resp.status}` });
        continue;
      }
      const commits: any[] = await resp.json();
      const items = (commits || []).map((c: any) => ({
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
      results.push({ repo: r.repo, label: r.label, error: String(err) });
      // avoid hitting API too fast if an error occurred
      await timeout(200);
    }
  }

  return new Response(JSON.stringify({ updated: new Date().toISOString(), results }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
