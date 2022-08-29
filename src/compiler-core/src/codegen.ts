import { isString } from '../../shared';
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
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
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
  const { children, tag, props } = node;
  console.log(children, 'children');
  push(`(`);
  push(helper(OPEN_BLOCK));
  push('(),');
  push(helper(CREATE_ELEMENT_BLOCK));
  push(`(`);
  genNodeList(genNullable([tag, props, children]), context);
  push(`)`);
  push(`)`);
}
function genNullable(list) {
  return list.map((arg) => arg || 'null');
}
function genNodeList(nodes, context) {
  const { push } = context;
  nodes.forEach((child, index) => {
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
    if (index < nodes.length - 1) {
      push(',');
    }
  });
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
function genCompoundExpression(node: any, context: any) {
  const { children } = node;
  const { push } = context;
  children.forEach((child) => {
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  });
}
