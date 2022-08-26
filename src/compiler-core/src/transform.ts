import { NodeTypes } from './ast';
import {
  CREATE_ELEMENT_BLOCK,
  OPEN_BLOCK,
  TO_DISPLAY_STRING,
} from './runtimeHelpers';

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
  root.codegenNode = root.children[0];
}
function traverseNode(node: any, context) {
  context.nodeTransforms.forEach((fn) => {
    fn(node);
  });
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      context.helper(OPEN_BLOCK);
      context.helper(CREATE_ELEMENT_BLOCK);
      traverseChildren(node, context);
      break;
    default:
      break;
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
