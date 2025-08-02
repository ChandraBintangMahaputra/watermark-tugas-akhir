import PDFWatermarkEditor from './components/PDFWatermarkEditor'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>PDF Watermark  (Gass Wisuda Tahun Ini)</h1>
        <p>Upload file PDF dan tambahkan watermark gambar dengan kontrol opacity, ukuran, dan posisi</p>
      </header>
      <main className="app-main">
        <PDFWatermarkEditor />
      </main>
    </div>
  )
}

export default App
