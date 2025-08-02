import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import './WatermarkEditor.css';

interface WatermarkSettings {
  opacity: number;
  position: 'left' | 'center' | 'right';
  size: number;
}

const PDFWatermarkEditor: React.FC = () => {
  const [uploadedPDF, setUploadedPDF] = useState<ArrayBuffer | null>(null);
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [watermarkFileName, setWatermarkFileName] = useState<string>('');
  const [settings, setSettings] = useState<WatermarkSettings>({
    opacity: 0.5,
    position: 'left',
    size: 100
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [processedPDFBytes, setProcessedPDFBytes] = useState<Uint8Array | null>(null);
  const [dragActive, setDragActive] = useState<'pdf' | 'watermark' | null>(null);
  
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedPDF(e.target?.result as ArrayBuffer);
        setPreviewURL(URL.createObjectURL(file));
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Silakan pilih file PDF yang valid');
    }
  };

  const handleWatermarkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setWatermarkFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setWatermarkImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Silakan pilih file gambar yang valid (PNG, JPG, etc.)');
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent, type: 'pdf' | 'watermark') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'pdf' | 'watermark') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      if (type === 'pdf' && file.type === 'application/pdf') {
        setPdfFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedPDF(e.target?.result as ArrayBuffer);
          setPreviewURL(URL.createObjectURL(file));
        };
        reader.readAsArrayBuffer(file);
      } else if (type === 'watermark' && file.type.startsWith('image/')) {
        setWatermarkFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          setWatermarkImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert(`Silakan pilih file ${type === 'pdf' ? 'PDF' : 'gambar'} yang valid`);
      }
    }
  };

  const applyWatermarkToPDF = async () => {
    if (!uploadedPDF || !watermarkImage) {
      alert('Silakan upload PDF dan gambar watermark terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    
    try {
    
      const pdfDoc = await PDFDocument.load(uploadedPDF);
      

      const imageBytes = await fetch(watermarkImage).then(res => res.arrayBuffer());
      

      let watermarkImg;
      if (watermarkImage.includes('data:image/png')) {
        watermarkImg = await pdfDoc.embedPng(imageBytes);
      } else {
        watermarkImg = await pdfDoc.embedJpg(imageBytes);
      }

  
      const pages = pdfDoc.getPages();
      
      pages.forEach(page => {
        const { width, height } = page.getSize();
        
  
        const watermarkHeight = height * (settings.size / 100);
        const aspectRatio = watermarkImg.width / watermarkImg.height;
        const watermarkWidth = watermarkHeight * aspectRatio;
        
    
        let x = 0;
        switch (settings.position) {
          case 'left':
            x = 0;
            break;
          case 'center':
            x = (width - watermarkWidth) / 2;
            break;
          case 'right':
            x = width - watermarkWidth;
            break;
        }
        
     
        page.drawImage(watermarkImg, {
          x,
          y: (height - watermarkHeight) / 2,
          width: watermarkWidth,
          height: watermarkHeight,
          opacity: settings.opacity,
        });
      });


      const pdfBytes = await pdfDoc.save();
      setProcessedPDFBytes(pdfBytes);
      

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewURL(url);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Terjadi kesalahan saat memproses PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    if (!processedPDFBytes) return;
    
    const blob = new Blob([processedPDFBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'watermarked-document.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="watermark-editor">      <div className="controls">
        <div className="upload-section">
          <h3>Upload File PDF</h3>
          <div 
            className={`upload-zone ${dragActive === 'pdf' ? 'drag-active' : ''}`}
            onDragEnter={(e) => handleDragEnter(e, 'pdf')}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pdf')}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePDFUpload}
              ref={pdfInputRef}
              className="file-input"
            />
            <button 
              onClick={() => pdfInputRef.current?.click()}
              className="upload-btn"
            >
              {dragActive === 'pdf' ? 'Lepaskan file PDF di sini' : 'Pilih File PDF atau Seret ke Sini'}
            </button>
          </div>
          {uploadedPDF && (
            <div className="file-info">
              <span>✓ PDF berhasil diupload</span>
              {pdfFileName && <small>{pdfFileName}</small>}
            </div>
          )}
        </div>

        <div className="upload-section">
          <h3>Upload Watermark</h3>
          <div 
            className={`upload-zone ${dragActive === 'watermark' ? 'drag-active' : ''}`}
            onDragEnter={(e) => handleDragEnter(e, 'watermark')}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'watermark')}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleWatermarkUpload}
              ref={watermarkInputRef}
              className="file-input"
            />
            <button 
              onClick={() => watermarkInputRef.current?.click()}
              className="upload-btn"
            >
              {dragActive === 'watermark' ? 'Lepaskan gambar di sini' : 'Pilih Gambar Watermark atau Seret ke Sini'}
            </button>
          </div>
          {watermarkImage && (
            <div className="watermark-preview">
              <div className="file-info">
                <span>✓ Watermark berhasil diupload</span>
                {watermarkFileName && <small>{watermarkFileName}</small>}
              </div>
              <img 
                src={watermarkImage} 
                alt="Watermark preview" 
                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>        <div className="settings-section">
          <h3>Pengaturan Watermark</h3>
          
          <div className="setting-group">
            <label htmlFor="opacity">
              Opacity: <span className="value-display">{Math.round(settings.opacity * 100)}%</span>
            </label>
            <input
              type="range"
              id="opacity"
              min="0"
              max="1"
              step="0.1"
              value={settings.opacity}
              onChange={(e) => setSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
              className="slider"
            />
            <div className="slider-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="setting-group">
            <label htmlFor="size">
              Ukuran: <span className="value-display">{settings.size}%</span>
            </label>
            <input
              type="range"
              id="size"
              min="10"
              max="200"
              step="10"
              value={settings.size}
              onChange={(e) => setSettings(prev => ({ ...prev, size: parseInt(e.target.value) }))}
              className="slider"
            />
            <div className="slider-labels">
              <span>10%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
          </div>

          <div className="setting-group">
            <label>Posisi Watermark:</label>
            <div className="radio-group">
              <label className={settings.position === 'left' ? 'active' : ''}>
                <input
                  type="radio"
                  name="position"
                  value="left"
                  checked={settings.position === 'left'}
                  onChange={(e) => setSettings(prev => ({ ...prev, position: e.target.value as 'left' }))}
                />
                <span>Kiri</span>
              </label>
              <label className={settings.position === 'center' ? 'active' : ''}>
                <input
                  type="radio"
                  name="position"
                  value="center"
                  checked={settings.position === 'center'}
                  onChange={(e) => setSettings(prev => ({ ...prev, position: e.target.value as 'center' }))}
                />
                <span>Tengah</span>
              </label>
              <label className={settings.position === 'right' ? 'active' : ''}>
                <input
                  type="radio"
                  name="position"
                  value="right"
                  checked={settings.position === 'right'}
                  onChange={(e) => setSettings(prev => ({ ...prev, position: e.target.value as 'right' }))}
                />
                <span>Kanan</span>
              </label>
            </div>
          </div>

          <button 
            onClick={applyWatermarkToPDF}
            className="upload-btn process-btn"
            style={{ marginTop: '2rem' }}
            disabled={!uploadedPDF || !watermarkImage || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="loading-spinner"></span>
                Memproses PDF...
              </>
            ) : (
              'Terapkan Watermark'
            )}
          </button>

          {processedPDFBytes && (
            <button 
              onClick={downloadPDF}
              className="download-btn"
              disabled={isProcessing}
            >
              Download PDF dengan Watermark
            </button>
          )}
        </div>
      </div>      <div className="preview-section">
        <h3>Preview PDF</h3>
        <div className="preview-controls">
          {uploadedPDF && watermarkImage && (
            <div className="preview-info">
              <span className="info-badge">📄 PDF Ready</span>
              <span className="info-badge">🖼️ Watermark Ready</span>
              {processedPDFBytes && <span className="info-badge success">✅ Processed</span>}
            </div>
          )}
        </div>
        <div className="pdf-preview-container">
          {previewURL ? (
            <iframe
              src={previewURL}
              width="100%"
              height="700px"
              style={{ border: 'none', borderRadius: '12px' }}
              title="PDF Preview"
            />
          ) : (
            <div className="no-preview">
              <div className="upload-illustration">
                <div className="upload-icon">📄</div>
                <div className="upload-arrow">⬆️</div>
              </div>
              <p>Upload PDF untuk melihat preview</p>
              <small>Drag & drop file PDF atau klik tombol upload</small>
            </div>
          )}
        </div>
        {isProcessing && (
          <div className="loading">
            <div className="processing-animation">
              <div className="loading-spinner"></div>
              <div className="processing-text">
                <p>Memproses watermark PDF...</p>
                <small>Mohon tunggu sebentar</small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFWatermarkEditor;
