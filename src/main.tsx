import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// 报告级样式：必须在 index.css 之后引入，保持与抽取前一致的层叠顺序
import './report/report.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
