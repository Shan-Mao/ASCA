(() => {
  'use strict';

  // 情景模板：所有逻辑都留在这个目录里，不依赖其他目录的文件。

  const state = document.querySelector('[data-state]');
  const button = document.querySelector('[data-demo]');
  let count = 0;

  if (button && state) {
    button.addEventListener('click', () => {
      count += 1;
      state.textContent = `点击了 ${count} 次`;
    });
  }
})();
