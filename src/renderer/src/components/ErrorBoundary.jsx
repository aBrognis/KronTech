import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, padding:32, textAlign:'center' }}>
        <AlertTriangle size={40} style={{ color:'#F87171', opacity:.8 }} />
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--t1)', marginBottom:6 }}>Ocorreu um erro nesta tela</div>
          <div style={{ fontSize:11, color:'var(--t3)', fontFamily:'monospace', maxWidth:520, wordBreak:'break-word' }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => this.setState({ error: null })}
          style={{ display:'flex', alignItems:'center', gap:6 }}
        >
          <RefreshCw size={13} /> Tentar novamente
        </button>
      </div>
    )
  }
}
