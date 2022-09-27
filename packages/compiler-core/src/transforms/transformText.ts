import { NodeTypes } from '../ast';
import { isText } from '../utils';
//将插值节点与文本节点融合成新节点，使用尾调用都可以进入node.type === NodeTypes.ELEMENT，还可以减少调用次数
export function transformText(node) {
  let currentContainer;
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push('+');
              currentContainer.children.push(next);
              children.splice(j, 1);
              j--;
            }
          }
        } else {
          currentContainer = undefined;
          break;
        }
      }
    };
  }
}
