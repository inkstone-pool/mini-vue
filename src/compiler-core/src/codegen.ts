import { NodeTypes } from './ast';
import {
  helperMapName,
  CTX,
  TO_DISPLAY_STRING,
  CACHE,
  RENDER,
  VUE,
  OPEN_BLOCK,
  CREATE_ELEMENT_BLOCK,
} from './runtimeHelpers';

export function generate(ast) {
  const context = createCodegenContext();
  const { push, helper } = context;
  genFunctionPreamble(ast, context);
  push('return ');
  const functionName = helperMapName[RENDER];
  const args = [helper(CTX), helper(CACHE)];
  const signature = args.join(',');
  push(`function ${functionName}(${signature}){`);
  push('return ');
  genNode(ast.codegenNode, context);
  push('}');
  return {
    code: context.code,
  };
}
function genFunctionPreamble(ast: any, context) {
  const { push } = context;
  const Vuebing = helperMapName[VUE];
  const alisaHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(alisaHelper).join(', ')} } = ${Vuebing}`);
  }

  push('\n');
}

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      genInterplation(node, context);
      break;
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    default:
      break;
  }
}

function genInterplation(node: any, context) {
  const { push, helper } = context;
  push(helper(TO_DISPLAY_STRING));
  push(`(`);
  genNode(node.content, context);
  push(`)`);
}
function genText(node: any, context: any) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genExpression(node: any, context: any) {
  const { push } = context;
  push(node.content);
}
function genElement(node: any, context: any) {
  const { push, helper } = context;
  push(`(`);
  push(helper(OPEN_BLOCK));
  push('(),');
  push(helper(CREATE_ELEMENT_BLOCK));
  push(`(`);
  genElementParam(node, context);
  push(`)`);
  push(`)`);
}
function genElementParam(node: any, context: any) {
  const { push } = context;
  push(`${node.tag}, null,`);
  node.children.forEach((node, index) => {
    if (index !== 0) {
      push(' + ');
    }
    genNode(node, context);
  });
  push(',1');
}
function createCodegenContext() {
  let context = {
    code: '',
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };
  return context;
}
function parenthesesInclude(context, fn) {
  const { push } = context;
  push(`(`);
  fn();
  push(`)`);
}
