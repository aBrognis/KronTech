import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// Wrapper fino sobre react-grid-layout com os mesmos parâmetros já usados no
// Dashboard — garante que o grid do Designer (preview ao vivo) seja
// pixel-idêntico ao grid real de apresentação.
export function WidgetGrid({ layout, width, onLayoutChange, isDraggable = true, isResizable = true, children }) {
  return (
    <GridLayout
      layout={layout}
      cols={12}
      rowHeight={72}
      width={width}
      draggableHandle=".widget-drag-handle"
      resizeHandles={['se']}
      onLayoutChange={onLayoutChange}
      margin={[14, 14]}
      containerPadding={[0, 0]}
      isDraggable={isDraggable}
      isResizable={isResizable}
    >
      {children}
    </GridLayout>
  )
}
