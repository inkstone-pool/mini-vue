import { NodeTypes } from '../ast';
import { CTX, helperMapName } from '../runtimeHelpers';

export function transformExpression(node) {
  console.log(node);
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}
function processExpression(node: any) {
  node.content = `_${helperMapName[CTX]}.` + node.content;
  return node;
}
