'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { marked } = require('marked');
const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/index.js');

const SUPPORTED_LANGUAGES = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript'
};

loadLanguages(['javascript', 'typescript']);

const renderer = new marked.Renderer();

renderer.code = function renderCode(code, infostring, escaped) {
  const language = normalizeLanguage(infostring);
  const highlighted = highlightCodeBlock(code, language);
  const className = language ? ` class="language-${language}"` : '';

  return `<pre${className}><code${className}>${highlighted}\n</code></pre>\n`;
};

marked.use({
  renderer,
  options: {
    langPrefix: 'language-'
  }
});

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
      const stats = fs.statSync(filePath);
      const publishedAt = stats.mtime;
      return {
        slug,
        displayVersion,
        html,
        summary: summaryText,
        publishedAt,
        publishedAtISO: publishedAt.toISOString().split('T')[0],
        publishedAtLabel: formatDate(publishedAt)
      };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug, 'en', { numeric: true, sensitivity: 'base' }));

  entries.forEach(entry => {
    const page = applyTemplate(layout, {
      pageTitle: `Mongoose Studio Changelog - ${entry.displayVersion}`,
      content: renderEntryPage(entry)
    });

    fs.writeFileSync(path.join(outputDir, `${entry.slug}.html`), page, 'utf8');
  });

  const index = applyTemplate(layout, {
    pageTitle: 'Mongoose Studio Changelog',
    content: renderIndex(entries)
  });

  fs.writeFileSync(path.join(outputDir, 'index.html'), index, 'utf8');

  console.log(`Built ${entries.length} changelog entr${entries.length === 1 ? 'y' : 'ies'}.`);
}

function highlightCodeBlock(code, language) {
  if (!language) {
    return escapeHtml(code);
  }

  const grammar = Prism.languages[language];
  return grammar ? Prism.highlight(code, grammar, language) : escapeHtml(code);
}

function normalizeLanguage(language) {
  if (!language) {
    return null;
  }

  const lower = language.toLowerCase().replace(/^language-/, '');
  return SUPPORTED_LANGUAGES[lower] || null;
}

function renderIndex(entries) {
  const articles = entries
    .map(entry => {
      const summary = entry.summary
        ? `<p class="mt-5 text-sm/6 text-gray-600 dark:text-gray-400">${escapeHtml(entry.summary)}</p>`
        : '';

      return `
        <article class="flex max-w-xl flex-col items-start justify-between">
          <div class="flex items-center gap-x-4 text-xs">
            <time datetime="${entry.publishedAtISO}" class="text-gray-500 dark:text-gray-400">${entry.publishedAtLabel}</time>
            <a href="/changelog/${entry.slug}.html" class="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800">Release</a>
          </div>
          <div class="group relative">
            <h3 class="mt-3 text-lg/6 font-semibold text-gray-900 group-hover:text-gray-600 dark:text-white dark:group-hover:text-gray-300">
              <a href="/changelog/${entry.slug}.html">
                <span class="absolute inset-0"></span>
                Mongoose Studio ${escapeHtml(entry.displayVersion)}
              </a>
            </h3>
            ${summary}
          </div>
        </article>
      `;
    })
    .join('\n');

  return `
    <div class="bg-white py-24 sm:py-32 dark:bg-gray-900">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl">
          <h2 class="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">From the changelog</h2>
          <p class="mt-2 text-lg/8 text-gray-600 dark:text-gray-300">Follow along with the latest releases of Mongoose Studio.</p>
          <div class="mt-10 space-y-16 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16 dark:border-gray-700">
            ${articles}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEntryPage(entry) {
  return `
    <section class="bg-white py-24 sm:py-32 dark:bg-gray-900">
      <div class="mx-auto max-w-4xl px-6 lg:px-8">
        <div class="flex flex-col gap-4 border-b border-gray-200 pb-10 dark:border-gray-700">
          <span class="text-sm font-medium uppercase tracking-wide text-red-berry-600">Release Notes</span>
          <h1 class="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">Mongoose Studio ${escapeHtml(entry.displayVersion)}</h1>
          <time datetime="${entry.publishedAtISO}" class="text-sm text-gray-500 dark:text-gray-400">Released ${entry.publishedAtLabel}</time>
        </div>
        <article class="mt-12 space-y-6 text-base leading-relaxed text-slate-700 dark:text-gray-300">
          ${entry.html}
        </article>
      </div>
    </section>
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

function formatDate(date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
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
