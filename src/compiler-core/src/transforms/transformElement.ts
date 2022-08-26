import { NodeTypes } from '../ast';

export function transformElement(node) {
  if (node.type === NodeTypes.ELEMENT) {
    node.content = node.children[0].content;
  }
  console.log(node);
}
