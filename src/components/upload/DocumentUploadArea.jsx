import React, { useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import {
  SAMPLE_RENTAL_CONTRACT,
  SAMPLE_STUDENT_BOND,
  SAMPLE_EMPLOYMENT_CONTRACT,
} from '../../data/demo-data/sample-contracts.js';

export function DocumentUploadArea({ onSelectSample, onFileSelected, isAnalyzing = false }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelected) {
      onFileSelected(file);
    }
  };

  return (
    <Card className="p-6 md:p-8 border-dashed border-2 border-slate-700/80 hover:border-emerald-500/50 transition-colors">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Inspect Your Legal Document</h3>
        <p className="text-sm text-slate-400 max-w-lg mb-6">
          Upload any residential rental agreement, student coaching bond, or employment contract. Text is extracted and sanitized <span className="text-emerald-400 font-semibold">100% locally</span> before analysis.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload PDF or Photo
          </Button>
        </div>

        <div className="w-full border-t border-slate-800 pt-6 mt-2">
          <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider mb-3">
            Or Test With Verified Indian Contract Samples
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onSelectSample(SAMPLE_RENTAL_CONTRACT)}
              disabled={isAnalyzing}
              className="text-xs py-1.5"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Bengaluru Rental Lease (11-Mo)
            </Button>
            <Button
              variant="secondary"
              onClick={() => onSelectSample(SAMPLE_STUDENT_BOND)}
              disabled={isAnalyzing}
              className="text-xs py-1.5"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-red-400" />
              Kota Coaching Bond (No-Refund)
            </Button>
            <Button
              variant="secondary"
              onClick={() => onSelectSample(SAMPLE_EMPLOYMENT_CONTRACT)}
              disabled={isAnalyzing}
              className="text-xs py-1.5"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              Service Bond & Non-Compete
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Local PDF.js / OCR</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Regex PII Redaction</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Rules</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
