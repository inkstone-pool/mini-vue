import { transform } from '../src/transform';
import { baseParse } from '../src/parse';
import { NodeTypes } from '../src/ast';

describe('transform', () => {
  it('simple transform', () => {
    const ast = baseParse('<div>hello,{{message}}</div>');
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + 'minivue';
      }
    };
    transform(ast, {
      nodeTransforms: [plugin],
    });
    const nodeText = ast.children[0].children[0];

    expect(nodeText.content).toBe('hello,minivue');
  });
});
