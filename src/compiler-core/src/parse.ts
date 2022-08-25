import { NodeTypes } from './ast';
const enum TagType {
  START,
  END,
}
const openDelimiter = '{{';
const closeDelimiter = '}}';
//process and advanceBy
export function baseParse(content: String) {
  const context = creatrParseContext(content);
  return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
  const nodes: any = [];
  while (!isEnd(context, ancestors)) {
    let node;
    let s = context.source;
    if (s.startsWith('{{')) {
      node = parseInterpolation(context);
    } else if (s[0] === '<') {
      if (/[a-z]/.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }
    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }
  return nodes;
}
function isEnd(context, ancestors) {
  const s = context.source;
  if (s.startsWith('</')) {
    for (const ancestor of ancestors) {
      for (let index = ancestors.length-1; index > 0; index--) {
        const tag = ancestors[index];
        if (startsWithEndTagOpen(s, tag)) {
          return true;
        }
      }
    }
  }
  return !s;
}
function parseInterpolation(context) {
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length,
  );
  advanceBy(context, openDelimiter.length);
  const rawContentLength = closeIndex - openDelimiter.length;

  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();

  advanceBy(context, closeDelimiter.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}
function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}
function creatrParseContext(content: String) {
  return {
    source: content,
  };
}
function parseElement(context, ancestors) {
  const element: any = parseTag(context, TagType.START);
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.END);
  } else {
    throw new Error(`缺少结束标签:${element.tag}`);
  }

  return element;
}
function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith('</') &&
    source.slice(2, 2 + tag.tag.length).toLowerCase() === tag.toLowerCase()
  );
}
function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === TagType.END) return;
  return {
    type: NodeTypes.ELEMENT,
    tag: match[1],
  };
}
function parseText(context: any): any {
  let endTokenList = [openDelimiter, '<'];
  let endIndex = context.source.length;

  for (const endToken of endTokenList) {
    let findindex = context.source.indexOf(endToken);
    console.log(findindex);
    if (findindex !== -1 && endIndex > findindex) {
      endIndex = findindex;
    }
  }
  const content = parseTextData(context, endIndex);
  return { type: NodeTypes.TEXT, content };
}
function parseTextData(context: any, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, content.length);
  return content;
}
