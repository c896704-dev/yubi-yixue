import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-box">
          <h2 className="error-title">页面渲染出错</h2>
          <pre className="error-detail">{this.state.error?.message || '未知错误'}</pre>
          <button
            className="btn btn-primary btn-md"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
