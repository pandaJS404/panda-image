import React from 'react'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="error-boundary">
          <h2 className="error-boundary__title">应用发生了意外错误</h2>
          <p className="error-boundary__message">请刷新页面重试，或点击下方按钮恢复。</p>
          <button type="button" className="error-boundary__action" onClick={this.handleRetry}>
            恢复应用
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
