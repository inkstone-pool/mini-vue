import { NodeTypes } from '../ast';
import { CTX, helperMapName, TO_DISPLAY_STRING } from '../runtimeHelpers';

export function transformExpression(node, context) {
  if (node.type === NodeTypes.INTERPOLATION) {
    context.helper(TO_DISPLAY_STRING);
    node.content = processExpression(node.content);
  }
}
function processExpression(node: any) {
  node.content = `_${helperMapName[CTX]}.` + node.content;
  return node;
}
