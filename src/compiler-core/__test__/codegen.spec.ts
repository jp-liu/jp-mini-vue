import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformExpress } from "../src/transforms/transformExpress";

describe('codegen', () => {
  it('should gen for string', () => {
    const ast = baseParse('hi')
    transform(ast)
    const { code } = generate(ast)
    // 快照测试,
    // 1.有意更新
    // 2.错误对比
    expect(code).toMatchSnapshot()
  });

  it('should gen for interpolation', () => {
    const ast = baseParse('{{message}}')
    transform(ast, {
      nodeTransforms: [transformExpress]
    })
    const { code } = generate(ast)
    // 快照测试,
    // 1.有意更新
    // 2.错误对比
    expect(code).toMatchSnapshot()
  });
});
