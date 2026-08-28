// Type declaration for bundled highlight.js [打包后的 highlight.js 类型声明]
declare const hljs: {
  highlight(code: string, options: { language: string }): { value: string };
  highlightAuto(code: string): { value: string };
  getLanguage(name: string): unknown;
};
export default hljs;
