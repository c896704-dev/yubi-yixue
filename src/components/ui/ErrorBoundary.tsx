import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 max-w-lg mx-auto mt-16">
          <div className="card border-negative-200 bg-negative-50">
            <h2 className="font-serif text-lg font-semibold text-negative-400 mb-3">页面渲染出错</h2>
            <pre className="text-xs text-[#4C4C4C] whitespace-pre-wrap break-all bg-white rounded-lg p-3 max-h-64 overflow-auto">
              {this.state.error?.message || '未知错误'}
            </pre>
            <button
              className="btn btn-primary btn-sm mt-4"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
