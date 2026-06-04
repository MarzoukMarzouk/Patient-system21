'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 30, maxWidth: 800, margin: '40px auto', direction: 'rtl' }}>
          <div className="alert alert-danger">
            <h4>حدث خطأ غير متوقع</h4>
            <p><strong>الرسالة:</strong> {String(this.state.error?.message || this.state.error)}</p>
            {this.state.info && (
              <details>
                <summary>تفاصيل تقنية</summary>
                <pre style={{ background: '#f8f9fa', padding: 10, fontSize: 12, overflow: 'auto' }}>
                  {this.state.info.componentStack}
                </pre>
              </details>
            )}
            <button className="btn btn-primary mt-2" onClick={() => location.reload()}>
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
