import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { agriReels } from '../mock/mockData';
import { Play, Eye, Share2, ThumbsUp, MessageSquare, Volume2, Plus, ArrowLeft } from 'lucide-react';

export const AgriReels = () => {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [likes, setLikes] = useState({ 0: false, 1: false, 2: false });

  const activeReel = agriReels[activeReelIndex];

  const handleLikeToggle = (idx) => {
    setLikes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
          AgriReels
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Learn smart farming techniques and crop diseases prevention in 90 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Mobile-Style Vertical Reels Viewer */}
        <div className="lg:col-span-1 flex justify-center">
          <div className="relative w-full max-w-[340px] aspect-[9/16] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900">
            {/* Reel Video Thumbnail Mock */}
            <img
              src={activeReel.thumbnail}
              alt={activeReel.title}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-md text-white border border-white/20 scale-90 opacity-70">
                <Play className="h-8 w-8 fill-white ml-0.5" />
              </div>
            </div>

            {/* Top Indicator overlays */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white">
              <Badge variant="primary" className="bg-primary-600/90 text-white border-none py-1">
                {activeReel.category}
              </Badge>
              <button className="p-1.5 bg-slate-900/60 rounded-full backdrop-blur-xs text-white">
                <Volume2 className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Right Interactions Sidebar */}
            <div className="absolute right-3.5 bottom-24 z-10 flex flex-col items-center gap-4.5 text-white">
              {/* Like */}
              <button
                onClick={() => handleLikeToggle(activeReelIndex)}
                className="flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className={`p-3 rounded-full backdrop-blur-md border ${
                  likes[activeReelIndex]
                    ? 'bg-rose-500 border-rose-400 text-white'
                    : 'bg-slate-900/65 border-white/10 text-white hover:bg-slate-900/80'
                }`}>
                  <ThumbsUp className="h-5 w-5 fill-current" />
                </div>
                <span className="text-[10px] font-bold">{likes[activeReelIndex] ? 'Liked' : 'Like'}</span>
              </button>

              {/* Share */}
              <button
                onClick={() => alert("Reel link copied to clipboard!")}
                className="flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="p-3 bg-slate-900/65 border border-white/10 rounded-full backdrop-blur-md text-white hover:bg-slate-900/80">
                  <Share2 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold">Share</span>
              </button>

              {/* Views */}
              <div className="flex flex-col items-center gap-1">
                <div className="p-3 bg-slate-900/65 border border-white/10 rounded-full backdrop-blur-md text-white">
                  <Eye className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold">{activeReel.views.split(' ')[0]}</span>
              </div>
            </div>

            {/* Bottom Meta Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-slate-950 shadow-xs">
                  AQ
                </div>
                <span className="font-semibold text-xs text-slate-100">AgriQueue Advisor</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-900 px-1.5 py-0.5 rounded-sm">Verified</span>
              </div>

              <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed mb-2">
                {activeReel.title}
              </p>
              
              <span className="text-[10px] text-slate-400 font-semibold">
                Duration: {activeReel.duration} mins • Subtitled in 8 Indian Languages
              </span>
            </div>
          </div>
        </div>

        {/* Right: Video Playlists/Topics Selector */}
        <div className="lg:col-span-2 space-y-4">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
            More Educational Reels
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agriReels.map((reel, idx) => (
              <div
                key={reel.id}
                onClick={() => setActiveReelIndex(idx)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex gap-4 ${
                  activeReelIndex === idx
                    ? 'bg-white border-primary-500 shadow-sm'
                    : 'bg-white/60 border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Small thumbnail */}
                <div className="w-24 aspect-video rounded-lg overflow-hidden bg-slate-200 shrink-0 relative">
                  <img
                    src={reel.thumbnail}
                    alt={reel.title}
                    className="w-full h-full object-cover"
                  />
                  {activeReelIndex === idx && (
                    <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center">
                      <Play className="h-5 w-5 fill-white text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <span className="inline-block text-[9px] font-extrabold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded-md leading-none">
                      {reel.category}
                    </span>
                    <h3 className={`font-heading font-bold text-sm leading-tight mt-1 truncate ${
                      activeReelIndex === idx ? 'text-primary-700 font-semibold' : 'text-slate-800'
                    }`}>
                      {reel.title}
                    </h3>
                  </div>

                  <p className="text-[10px] text-slate-450 font-semibold mt-2">
                    {reel.views} • {reel.duration} mins
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Feedback Form */}
          <Card className="border-slate-100 mt-4.5 bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Request Educational Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                Want to learn about a specific pest management, harvesting machine, or fertilizer technique? Tell us, and our agronomists will create a short video.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Drip irrigation maintenance..."
                  className="flex-1 p-2.5 rounded-xl border border-slate-150 bg-white text-xs font-semibold focus:outline-none focus:border-primary-500"
                />
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs shrink-0"
                  onClick={() => alert("Topic request submitted!")}
                >
                  Submit Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
