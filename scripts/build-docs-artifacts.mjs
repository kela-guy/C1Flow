import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import matter from 'gray-matter';

const DOCS_DIR = 'src/content/docs';
const SEARCH_INDEX = 'src/docs/search-index.json';
const LLMS = 'public/llms.txt';
const LLMS_FULL = 'public/llms-full.txt';
const DOC_ORDER = ['/docs', '/docs/installation', '/docs/theming', '/docs/components', '/docs/components/button'];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function urlForFile(path) {
  const rel = relative(DOCS_DIR, path).replace(/\\/g, '/').replace(/\.mdx$/, '');
  if (rel === 'index') return '/docs';
  if (rel.endsWith('/index')) return `/docs/${rel.slice(0, -'/index'.length)}`;
  return `/docs/${rel}`;
}

function titleFromPath(path) {
  const rel = relative(DOCS_DIR, path).replace(/\\/g, '/');
  const slug = rel === 'index.mdx'
    ? 'introduction'
    : rel.endsWith('/index.mdx')
      ? rel.split('/').at(-2)
      : rel.replace(/\.mdx$/, '').split('/').at(-1);
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function stripJsx(markdown) {
  return markdown
    .replace(/<PMCodeBlock\s+command="([^"]+)"\s*\/>/g, '\n```bash\n$1\n```\n')
    .replace(/<Callout>\s*([\s\S]*?)\s*<\/Callout>/g, '\n> $1\n')
    .replace(/<PickerGrid>|<\/PickerGrid>/g, '')
    .replace(/<PickerCard\s+href="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/PickerCard>/g, '- [$2]($1): $3')
    .replace(/<ApiTable[\s\S]*?\/>/g, '_API table available on the rendered docs page._')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function descriptionFromMarkdown(markdown) {
  const plain = stripJsx(markdown)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('```'));
  return plain ?? '';
}

function headingsFromMarkdown(markdown) {
  return [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((match) => {
    const text = match[2].trim();
    return {
      id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      text,
      level: match[1].length,
    };
  });
}

const files = walk(DOCS_DIR)
  .filter((path) => path.endsWith('.mdx'))
  .sort((a, b) => {
    const aIndex = DOC_ORDER.indexOf(urlForFile(a));
    const bIndex = DOC_ORDER.indexOf(urlForFile(b));
    if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
    return urlForFile(a).localeCompare(urlForFile(b));
  });

const pages = files.map((path) => {
  const raw = readFileSync(path, 'utf8');
  const parsed = matter(raw);
  const title = parsed.data.title ?? titleFromPath(path);
  const description = parsed.data.description ?? descriptionFromMarkdown(parsed.content);
  return {
    path,
    url: urlForFile(path),
    title,
    description,
    headings: headingsFromMarkdown(parsed.content),
    markdown: stripJsx(parsed.content),
  };
});

mkdirSync(dirname(SEARCH_INDEX), { recursive: true });
mkdirSync(dirname(LLMS), { recursive: true });

writeFileSync(
  SEARCH_INDEX,
  `${JSON.stringify(pages.map(({ title, description, url, headings }) => ({ title, description, url, headings })), null, 2)}\n`,
);

const toc = pages.map((page) => `- [${page.title}](${page.url}) — ${page.description}`).join('\n');
writeFileSync(
  LLMS,
  `# C2 Hub docs\n\n${toc}\n\nRegistry base install: pnpm dlx shadcn@latest add @c2/c2-base\n`,
);

writeFileSync(
  LLMS_FULL,
  pages
    .map((page) => `---\ntitle: ${page.title}\ndescription: ${page.description}\nurl: ${page.url}\n---\n\n# ${page.title}\n\n${page.markdown}\n\nSource: ${page.url}`)
    .join('\n\n'),
);

console.log(`Generated ${SEARCH_INDEX}, ${LLMS}, and ${LLMS_FULL} for ${pages.length} docs pages.`);
