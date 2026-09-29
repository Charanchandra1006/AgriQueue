import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Upload, HelpCircle, ShieldCheck, HeartPulse, ChevronRight, Check, Eye } from 'lucide-react';

export const AICropDoctor = () => {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const handleUpload = () => {
    if (!file) return;
    setIsAnalyzing(true);
    // Simulate diagnosis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setReport({
        crop: "Rice / Paddy",
        health: "Unhealthy (Infection Found)",
        disease: "Rice Blast (Pyricularia oryzae)",
        severity: "Moderate (25-30% Leaf Area Affected)",
        confidence: "94.6%",
        symptoms: [
          "Diamond-shaped lesions on leaves with greyish centers.",
          "Brownish borders on leaf spots.",
          "Lesions on nodes causing stalks to bend and break."
        ],
        organicTreatments: [
          "Spray Pseudomonas fluorescens formulation @ 10g/litre of water.",
          "Avoid excessive nitrogenous fertilizer application.",
          "Burn crop residue of infected crops to destroy spores."
        ],
        chemicalTreatments: [
          "Spray Tricyclazole 75 WP @ 1g/litre of water immediately.",
          "Apply Carbendazim 50 WP @ 1g/litre as an alternative spray."
        ]
      });
    }, 2500);
  };

  const handleReset = () => {
    setFile(null);
    setReport(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
          AI Crop Doctor
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Take a photo of crop leaves or pests to identify diseases instantly and get treatment guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload and Capture Section */}
        <div className="lg:col-span-1">
          <Card className="border-slate-100 h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Leaf Diagnosis Scanner</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-5 flex-1 flex flex-col justify-between">
              <div>
                {!file ? (
                  <div
                    onClick={() => setFile({ name: "leaf_image.jpg", size: "2.4 MB" })}
                    className="border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center min-h-[220px]"
                  >
                    <Upload className="h-10 w-10 text-slate-400 mb-3" />
                    <p className="font-heading font-bold text-slate-700 text-sm leading-none">Upload leaf image</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">PNG, JPG, up to 10MB</p>
                    
                    <span className="inline-block mt-4 text-[10px] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                      Click to load mock image
                    </span>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                    {/* Simulated leaf image placeholder */}
                    <div className="relative aspect-video rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center text-white">
                      <img
                        src="https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&h=250&fit=crop"
                        alt="Scanned crop leaf"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                      />
                      <div className="relative z-10 flex flex-col items-center">
                        <HeartPulse className={`h-8 w-8 text-rose-400 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-bold mt-1 tracking-wider">Ready for Diagnosis</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <span className="text-slate-400">{file.size}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 flex gap-2">
                {file && !report && !isAnalyzing && (
                  <Button
                    variant="primary"
                    className="w-full text-sm"
                    onClick={handleUpload}
                  >
                    Scan & Diagnose
                  </Button>
                )}
                {file && (report || isAnalyzing) && (
                  <Button
                    variant="outline"
                    className="w-full text-sm text-slate-500"
                    onClick={handleReset}
                    disabled={isAnalyzing}
                  >
                    Reset Scanner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagnosis Report Section */}
        <div className="lg:col-span-2">
          {isAnalyzing ? (
            <Card className="border-slate-100 h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="relative h-16 w-16 mb-4">
                {/* Simulated circular scanning effect */}
                <div className="absolute inset-0 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
                <HeartPulse className="absolute inset-0 m-auto h-7 w-7 text-primary-600 animate-pulse" />
              </div>
              <h3 className="font-heading font-extrabold text-slate-800 text-lg">Analyzing Leaf Specimen...</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-xs mt-1 leading-relaxed">
                Checking color patterns, lesion dimensions, and disease symptoms using artificial vision models.
              </p>
            </Card>
          ) : report ? (
            <Card className="border-rose-100 bg-white">
              <CardHeader className="border-b border-rose-50/50 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-rose-50 text-rose-600 rounded-lg">
                      <HeartPulse className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-rose-900">Diagnosis: {report.disease}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">{report.severity} Severity</Badge>
                    <span className="text-xs font-bold text-slate-400">Confidence: {report.confidence}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-4.5">
                {/* Summary Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Crop</span>
                    <span className="font-bold text-slate-700 mt-0.5 text-sm block">{report.crop}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Status</span>
                    <span className="font-bold text-rose-600 mt-0.5 text-sm block">{report.health}</span>
                  </div>
                </div>

                {/* Symptoms List */}
                <div>
                  <h4 className="font-heading font-bold text-slate-800 text-sm mb-2.5">Identified Symptoms</h4>
                  <ul className="space-y-1.5">
                    {report.symptoms.map((sym, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                        <span>{sym}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Treatment tabs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-50">
                  {/* Organic solutions */}
                  <div className="space-y-3">
                    <h5 className="font-heading font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-emerald-50 text-emerald-600"><ShieldCheck className="h-4 w-4" /></span>
                      Organic Treatments
                    </h5>
                    <ul className="space-y-2">
                      {report.organicTreatments.map((tr, idx) => (
                        <li key={idx} className="text-xs text-emerald-900 flex items-start gap-1.5 leading-relaxed font-medium">
                          <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                          <span>{tr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Chemical solutions */}
                  <div className="space-y-3">
                    <h5 className="font-heading font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-slate-100 text-slate-600"><Eye className="h-4 w-4" /></span>
                      Chemical Sprays
                    </h5>
                    <ul className="space-y-2">
                      {report.chemicalTreatments.map((tr, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-relaxed font-medium">
                          <Check className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                          <span>{tr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-100 h-full flex flex-col items-center justify-center py-16 text-center bg-slate-50/20">
              <HeartPulse className="h-14 w-14 text-slate-300 mb-3" />
              <h3 className="font-heading font-extrabold text-slate-700 text-base">No Diagnosis Result</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-xs mt-1 leading-relaxed">
                Provide a photo of the affected crop leaf in the scanner on the left to generate treatment recommendations.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
