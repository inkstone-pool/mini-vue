import { NodeTypes } from '../ast';

export function isText(node) {
  return [NodeTypes.TEXT, NodeTypes.INTERPOLATION].includes(node.type);
}
