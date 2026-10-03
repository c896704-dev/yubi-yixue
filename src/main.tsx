import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// 报告级样式：必须在 index.css 之后引入，保持与抽取前一致的层叠顺序
import './report/report.css'
// 打印样式：必须最后引入 —— 全站打印规则集中在此，需盖掉上面两个文件里的屏幕样式
import './report/print.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
