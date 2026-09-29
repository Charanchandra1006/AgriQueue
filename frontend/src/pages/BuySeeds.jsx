import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Search, ShoppingCart, ShieldAlert, Award, Star } from 'lucide-react';

export const BuySeeds = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const seeds = [
    {
      id: 1,
      name: "Pusa Basmati 1121",
      crop: "Paddy (Rice)",
      price: "₹1,200",
      unit: "25kg bag",
      rating: 4.8,
      germination: "92%",
      certified: true,
      vendor: "National Seeds Corp (NSC)",
      thumbnail: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=200&h=200&fit=crop"
    },
    {
      id: 2,
      name: "HD 2967 (Kalyan Sona)",
      crop: "Wheat",
      price: "₹850",
      unit: "40kg bag",
      rating: 4.9,
      germination: "95%",
      certified: true,
      vendor: "Punjab Agriculture Seed Depot",
      thumbnail: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop"
    },
    {
      id: 3,
      name: "Hybrid Seed Corn Pioneer 30G37",
      crop: "Maize (Corn)",
      price: "₹2,100",
      unit: "5kg pack",
      rating: 4.6,
      germination: "90%",
      certified: true,
      vendor: "Pioneer Seeds India",
      thumbnail: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200&h=200&fit=crop"
    },
    {
      id: 4,
      name: "Pusa Bold (Mustard)",
      crop: "Oilseeds",
      price: "₹450",
      unit: "2kg pack",
      rating: 4.7,
      germination: "89%",
      certified: true,
      vendor: "Rajasthan Seed Federation",
      thumbnail: "https://images.unsplash.com/photo-1563514223741-24b99e8e4130?w=200&h=200&fit=crop"
    }
  ];

  const filteredSeeds = seeds.filter(seed =>
    seed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seed.crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
            Certified Seeds Store
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Order certified high-yielding seed varieties approved by State Agriculture Departments.
          </p>
        </div>
      </div>

      {/* Certification Trust banner */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <Award className="h-6 w-6 text-emerald-600 shrink-0" />
        <p className="text-xs md:text-sm font-semibold text-emerald-800 leading-normal">
          <strong>100% Certified Guarantee:</strong> All seeds purchased through AgriQueue include a digital stamp of authenticity verifying seed health, variety purity, and germination rates.
        </p>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
        <Search className="h-5 w-5 text-slate-400 shrink-0 ml-1.5" />
        <input
          type="text"
          placeholder="Search by variety or crop (e.g. Basmati, Wheat)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-slate-700 placeholder-slate-400 focus:outline-none text-sm font-medium"
        />
      </div>

      {/* Seeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSeeds.map((seed) => (
          <Card key={seed.id} className="border-slate-100 flex flex-col sm:flex-row gap-5">
            {/* Thumbnail */}
            <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
              <img
                src={seed.thumbnail}
                alt={seed.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                    {seed.crop}
                  </span>
                  <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    <span>{seed.rating}</span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-base md:text-lg text-slate-800 mt-1.5 leading-snug">
                  {seed.name}
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-tight">
                  Vendor: {seed.vendor}
                </p>
              </div>

              {/* Seed Spec Row */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span>Germination: <strong className="text-slate-700">{seed.germination}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <Award className="h-3.5 w-3.5" />
                  Govt Certified
                </span>
              </div>

              {/* Pricing & Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50 gap-3">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Price</span>
                  <p className="font-heading font-extrabold text-slate-800 text-lg md:text-xl mt-0.5">
                    {seed.price}
                    <span className="text-[10px] text-slate-400 font-medium">/{seed.unit}</span>
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  icon={ShoppingCart}
                  className="text-xs"
                  onClick={() => alert(`Ordered 1 x ${seed.name}`)}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
