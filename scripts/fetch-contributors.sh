#!/bin/bash
# Fetches top contributors for each plugin from GitHub API
# and updates plugins.json with maintainer info

set -e

PLUGINS_JSON="src/data/plugins.json"
TEMP_FILE=$(mktemp)

# Copy original
cp "$PLUGINS_JSON" "$TEMP_FILE"

# Process each plugin
node -e "
const fs = require('fs');
const { execSync } = require('child_process');
const plugins = require('../$PLUGINS_JSON');

async function getContributors(repo, path) {
  try {
    // Get all commits for this path (up to 100)
    const cmd = \`gh api \"repos/\${repo}/commits?path=\${path}&per_page=100\" --jq '[.[] | {login: .author.login, avatar: .author.avatar_url}]'\`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
    const commits = JSON.parse(result);

    // Count contributions per author
    const counts = {};
    commits.forEach(c => {
      if (!c.login) return;
      if (!counts[c.login]) counts[c.login] = { login: c.login, avatar: c.avatar, commits: 0 };
      counts[c.login].commits++;
    });

    // Sort by commits desc, take top 3
    return Object.values(counts)
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 3)
      .map(c => ({ login: c.login, avatarUrl: c.avatar }));
  } catch (e) {
    console.error('  Error:', e.message);
    return [];
  }
}

(async () => {
  for (const plugin of plugins) {
    let repo, path;

    if (plugin.slug.startsWith('v2-')) {
      repo = 'flyteorg/flyte-sdk';
      const name = plugin.slug.replace('v2-', '');
      path = 'plugins/' + name;
    } else {
      repo = 'flyteorg/flytekit';
      path = 'plugins/flytekit-' + plugin.slug;
    }

    console.error('Processing:', plugin.slug, '->', repo + '/' + path);
    const contributors = await getContributors(repo, path);
    plugin.maintainers = contributors;
    console.error('  Found', contributors.length, 'contributors:', contributors.map(c => c.login).join(', '));

    // Rate limit: small delay between requests
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync('$PLUGINS_JSON', JSON.stringify(plugins, null, 2) + '\\n');
  console.error('Done! Updated', plugins.length, 'plugins');
})();
"
