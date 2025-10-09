const parseMD = require('parse-md').default;
const path = require('path');
const pkgUp = require('pkg-up');
const pkg = pkgUp.sync({ cwd: process.cwd() });
const root = process.platform === 'win32' ? path.win32.dirname(pkg) : path.dirname(pkg);

module.exports = function(source) {
  const urlsRegex = /(?<!!)\[[^\]]+\]\([^)]+\)/g;
  const urlRegex =  /\[\s*(.*?)\s*\]\((.*?)\)/s;
  const urls = source.match(urlsRegex) || [];
  const importStatement = `
import Term from "${ this.query.termPreviewComponentPath || "@grnet/docusaurus-term-preview"}";
  `;
  if (urls.length > 0) {
    const { content } = parseMD(source);
    source = source.replace(content, importStatement + content);
    for (const url of urls) {
      const [mdUrl, title, urlPath] = url.match(urlRegex);
      const newLineRegex = /\n/g;
      const newLineCount = (title.match(newLineRegex) || []).length;
      if (newLineCount <= 1) {
        const rel_path = process.platform === 'win32' ? path.win32.relative(root, this.resourcePath) : path.relative(root, this.resourcePath);
        const pathName = new URL(urlPath, `http://bla.com/${rel_path}`).pathname;
        if (pathName.includes(this.query.termsDir.replace(/\./, ''))) {
          const docsDir = '/docs';
          const routeBasePath = '/documentation';

          const pathRelativeToDocsDir = path.relative(docsDir, pathName);
          const targetPathName = path.posix.join(
            routeBasePath,
            pathRelativeToDocsDir
          );

          const termKey =
            this.query.baseUrl.replace(/\/$/, '') +
            targetPathName.replace(/\.(md|mdx)$/, '');
          source = source.replace(
            mdUrl,
            `<Term pathName="${termKey.replace(/\d+-/, '')}">${title}</Term>`
          );
        }
      }
    }
  }

  return source;
};
