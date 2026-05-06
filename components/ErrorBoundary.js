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
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 40,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ marginBottom: 12 }}>应用发生了意外错误</h2>
          <p style={{ marginBottom: 24, color: '#666' }}>请刷新页面重试，或点击下方按钮恢复。</p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              padding: '8px 24px',
              fontSize: 14,
              cursor: 'pointer',
              borderRadius: 6,
            }}
          >
            恢复应用
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
