import { NodeTypes } from './ast';

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = child;
  }
}
function traverseNode(node: any, context) {
  const exitFns: any = [];
  context.nodeTransforms.forEach((fn) => {
    const onExit = fn(node, context);
    onExit && exitFns.push(onExit);
  });
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}
function traverseChildren(node: any, context: any) {
  let children = node.children;
  if (children) {
    children.forEach((node) => {
      traverseNode(node, context);
    });
  }
}
