import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Camera, 
  Search, 
  CheckCircle2, 
  FlaskConical, 
  Leaf, 
  ShieldCheck, 
  Download, 
  ShoppingBag,
  History,
  Activity,
  Lightbulb,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../contexts/LanguageContext';

interface DiagnosisResult {
  condition: string;
  scientificName: string;
  confidence: number;
  description: string;
  chemicalControl: string;
  organicMethods: string;
  preventiveMeasures: string[];
}

export default function DiseaseDetection() {
  const { language, t } = useLanguage();
  const [analyzing, setAnalyzing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Convert base64 to parts
      const base64Data = image.split(',')[1];
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      };

      const prompt = `Analyze this crop image and identify any diseases or pests.
      Respond in ${language} language for all textual fields while preserving valid JSON.
      Provide the result in JSON format with the following structure:
      {
        "condition": "Common name of the disease/pest",
        "scientificName": "Scientific name",
        "confidence": number between 0 and 100,
        "description": "Brief description of the condition",
        "chemicalControl": "Recommended chemical treatment",
        "organicMethods": "Recommended organic treatment",
        "preventiveMeasures": ["measure 1", "measure 2", "measure 3"]
      }
      If the plant looks healthy, state "Healthy" as the condition.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(t('disease.error.failed', 'Failed to analyze the image. Please try again with a clearer photo.'));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto px-6 py-8 md:px-12 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">{t('disease.title', 'Disease Detection')}</h1>
        <p className="text-slate-600 max-w-2xl">{t('disease.subtitle', 'Leverage cutting-edge AI to identify crop diseases instantly. Simply upload a high-quality photo of your plant\'s leaves or affected areas.')}</p>
      </div>

      {/* Upload Section */}
      <section className="mb-12">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="image/*"
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer group p-8 md:p-16 ${
            image ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50'
          }`}
        >
          {image ? (
            <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-lg">
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-bold">{t('disease.changePhoto', 'Change Photo')}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <div className="max-w-md">
                <h3 className="text-xl font-bold text-slate-900">{t('disease.upload.title', 'Upload Crop Photo')}</h3>
                <p className="text-sm text-slate-600 mt-2">
                  {t('disease.upload.subtitle', 'Drag and drop or click to select a clear photo of the affected plant area. Supports JPG, PNG up to 10MB.')}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="flex min-w-[160px] items-center justify-center rounded-lg h-12 px-6 bg-white text-emerald-600 border border-emerald-600 font-bold text-sm hover:bg-emerald-50 transition-all"
            >
              {image ? t('disease.changePhoto', 'Change Photo') : t('disease.selectPhoto', 'Select Photo')}
            </button>
            {image && !analyzing && !result && (
              <button 
                onClick={(e) => { e.stopPropagation(); analyzeImage(); }}
                className="flex min-w-[160px] items-center justify-center rounded-lg h-12 px-6 bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
              >
                {t('disease.analyzeNow', 'Analyze Now')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {analyzing && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 size={48} className="text-emerald-600 animate-spin" />
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">{t('disease.analyzingTitle', 'Analyzing Your Crop...')}</h3>
            <p className="text-slate-500 text-sm">{t('disease.analyzingSubtitle', 'Our AI is identifying potential issues. This usually takes 5-10 seconds.')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-start gap-4 mb-8">
          <AlertCircle className="text-red-600 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-red-900">{t('disease.analysisFailed', 'Analysis Failed')}</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={analyzeImage}
              className="mt-3 text-sm font-bold text-red-900 underline hover:no-underline"
            >
              {t('disease.tryAgain', 'Try Again')}
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis Result */}
      {result && !analyzing && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Search className="text-emerald-600" size={28} />
            <h2 className="text-2xl font-bold text-slate-900">{t('disease.resultTitle', 'AI Analysis Result')}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Image Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-emerald-100 bg-white aspect-square shadow-sm">
                <img 
                  src={image || ''} 
                  alt="Analyzed crop" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-emerald-500/40 rounded-2xl pointer-events-none"></div>
                <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {t('disease.scanComplete', 'Scan Complete')}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-white border border-emerald-50 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-1">{t('disease.identifiedCondition', 'Identified Condition')}</p>
                    <h3 className="text-3xl font-black text-slate-900">{result.condition}</h3>
                    <p className="text-slate-500 text-sm italic">{result.scientificName}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <span className="text-2xl font-black">{result.confidence}%</span>
                      <CheckCircle2 size={18} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{t('disease.confidenceScore', 'CONFIDENCE SCORE')}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {result.description}
                </p>
              </div>

              {/* Treatment Plan */}
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FlaskConical className="text-emerald-600" size={20} />
                  {t('disease.treatmentPlan', 'Recommended Treatment Plan')}
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="size-8 rounded-lg bg-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                      <FlaskConical size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{t('disease.chemicalControl', 'Chemical Control')}</p>
                      <p className="text-xs text-slate-600">{result.chemicalControl}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="size-8 rounded-lg bg-green-200 flex items-center justify-center text-green-700 shrink-0">
                      <Leaf size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{t('disease.organicMethods', 'Organic Methods')}</p>
                      <p className="text-xs text-slate-600">{result.organicMethods}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="size-8 rounded-lg bg-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{t('disease.preventiveMeasures', 'Preventive Measures')}</p>
                      <ul className="list-disc ml-4 text-xs text-slate-600 space-y-1 mt-1">
                        {result.preventiveMeasures.map((measure, idx) => (
                          <li key={idx}>{measure}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button className="flex-1 bg-emerald-600 text-white text-xs font-bold py-3 rounded-lg hover:bg-emerald-700 transition-all uppercase tracking-wider flex items-center justify-center gap-2">
                    <Download size={14} /> {t('disease.downloadReport', 'Download Report')}
                  </button>
                  <button className="flex-1 bg-white text-emerald-600 border border-emerald-600 text-xs font-bold py-3 rounded-lg hover:bg-emerald-50 transition-all uppercase tracking-wider flex items-center justify-center gap-2">
                    <ShoppingBag size={14} /> {t('disease.buySupplies', 'Buy Supplies')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Bottom Stats */}
      <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('disease.stats.scanHistory', 'Scan History'), value: t('disease.stats.scanHistoryValue', '12 Total'), icon: History },
          { label: t('disease.stats.farmHealthIndex', 'Farm Health Index'), value: '88/100', icon: Activity },
          { label: t('disease.stats.dailyTip', 'Daily Tip'), value: t('disease.stats.dailyTipValue', 'Check for aphids early'), icon: Lightbulb, highlight: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-emerald-50 flex items-center gap-4 shadow-sm">
            <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.highlight ? 'text-emerald-600' : 'text-slate-900'}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
