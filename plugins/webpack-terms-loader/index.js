const parseMD = require('parse-md').default;
const store = require('@grnet/terminology-store');
const path = require('path');
const remark = require('remark')
const remarkHTML = require('remark-html')

module.exports = function(source) {
  const unixRegex = new RegExp(
    `(${this.query.termsDir
      .replace(/^\.\//, '')
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?)\.(md|mdx)`
  );
  const winRegex = new RegExp(
    `(${this.query.termsDir
      .replace(/\//g, "\\")
      .replace(/\./, "")
      .replace(/[*+?^${}()|[\]\\]/g, '\\$&')}.*?)\.(md|mdx)`
  );
  const unixResourcePath = this.resourcePath
  const winResourcePath = this.resourcePath.replace(/\\/, "\\\\")

  const termMatch = process.platform === 'win32' ? winResourcePath.match(winRegex) : unixResourcePath.match(unixRegex);

  if (termMatch) {
    const data = parseMD(source);
    const docsDir = 'docs';
    const routeBasePath = 'documentation';

    const resourcePath = termMatch[1].replace(/\d+-/, '');
    const resourcePathRelativeToDocsDir = path.relative(docsDir, resourcePath);
    const targetPath = path.posix.join(routeBasePath, resourcePathRelativeToDocsDir);

    data.metadata.hoverText = data.metadata.hoverText ? remark()
      .use(remarkHTML, { sanitize: true })
      .processSync(data.metadata.hoverText).contents : '';
    store.addTerm(targetPath, data);
    this.emitFile(targetPath + '.json', JSON.stringify(data));
  }

  return source;
};
