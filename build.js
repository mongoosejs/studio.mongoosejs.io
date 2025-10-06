'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { marked } = require('marked');

const opts = {
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY
};

console.log('Creating Mongoose studio', opts);

require('@mongoosejs/studio/frontend')(`/.netlify/functions/studio`, true, opts)
  .then(() => {
    execSync(
      `
      mkdir -p ./public/imdb
      cp -r ./node_modules/@mongoosejs/studio/frontend/public/* ./public/imdb/
      `
    );
    buildChangelog();
  })
  .catch(err => {
    console.error('Failed to build Mongoose Studio frontend', err);
    process.exit(1);
  });

function buildChangelog() {
  const changelogDir = path.join(__dirname, 'src', 'changelog');
  if (!fs.existsSync(changelogDir)) {
    console.log('No changelog entries found, skipping changelog build.');
    return;
  }

  const layoutPath = path.join(__dirname, 'src', 'layout.html');
  if (!fs.existsSync(layoutPath)) {
    console.warn('Missing layout at src/layout.html, skipping changelog build.');
    return;
  }

  const layout = fs.readFileSync(layoutPath, 'utf8');
  const outputDir = path.join(__dirname, 'public', 'changelog');
  fs.mkdirSync(outputDir, { recursive: true });

  const entries = fs
    .readdirSync(changelogDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(changelogDir, file);
      const markdown = fs.readFileSync(filePath, 'utf8');
      const html = marked.parse(markdown);
      const slug = path.basename(file, '.md');
      const summaryText = extractFirstParagraph(markdown);
      const displayVersion = slug.startsWith('v') ? slug : `v${slug}`;
      return {
        slug,
        displayVersion,
        html,
        summary: summaryText
      };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug, 'en', { numeric: true, sensitivity: 'base' }));

  entries.forEach(entry => {
    const page = applyTemplate(layout, {
      pageTitle: `Mongoose Studio Changelog - ${entry.displayVersion}`,
      heading: `Mongoose Studio ${entry.displayVersion}`,
      content: entry.html
    });

    fs.writeFileSync(path.join(outputDir, `${entry.slug}.html`), page, 'utf8');
  });

  const index = applyTemplate(layout, {
    pageTitle: 'Mongoose Studio Changelog',
    heading: 'Changelog',
    content: renderIndex(entries)
  });

  fs.writeFileSync(path.join(outputDir, 'index.html'), index, 'utf8');

  console.log(`Built ${entries.length} changelog entr${entries.length === 1 ? 'y' : 'ies'}.`);
}

function renderIndex(entries) {
  const items = entries
    .map(entry => {
      const summary = entry.summary
        ? `<p class="mt-2 text-sm text-slate-600">${escapeHtml(entry.summary)}</p>`
        : '';
      return `
        <li class="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <a href="/changelog/${entry.slug}.html" class="text-lg font-semibold text-slate-900 hover:text-blue-600 transition">
            ${entry.displayVersion}
          </a>
          ${summary}
        </li>
      `;
    })
    .join('\n');

  return `
    <p class="text-slate-600">Follow along with the latest releases of Mongoose Studio.</p>
    <ul class="mt-6 space-y-4">
      ${items}
    </ul>
  `;
}

function extractFirstParagraph(markdown) {
  const lines = markdown
    .split(/\r?\n/)
    .map(line => line.trim());

  const firstContentLine = lines.find(line => line && !line.startsWith('#'));

  return firstContentLine ? firstContentLine : '';
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyTemplate(template, { pageTitle, heading, content }) {
  const $ = cheerio.load(template);

  if (pageTitle) {
    $('title').first().text(pageTitle);
  }

  if (heading) {
    $('[data-slot="heading"]').first().text(heading);
  }

  if (content) {
    $('[data-slot="content"]').first().html(content);
  }

  return $.html();
}
