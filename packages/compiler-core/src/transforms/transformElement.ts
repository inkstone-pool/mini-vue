import { NodeTypes } from '../ast';
import { CREATE_ELEMENT_BLOCK, OPEN_BLOCK } from '../runtimeHelpers';

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children, props, tag } = node;
      const child = children[0];
      context.helper(OPEN_BLOCK);
      context.helper(CREATE_ELEMENT_BLOCK);
      const vondeElement = {
        type: NodeTypes.ELEMENT,
        tag: `'${tag}'`,
        props,
        children: child,
      };
      node.codegenNode = vondeElement;
    };
  }
}
