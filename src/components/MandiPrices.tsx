import React from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Store, 
  Calendar, 
  Download, 
  TrendingDown, 
  Minus,
  Wheat,
  Sprout,
  Cloud,
  CircleDot,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function MandiPrices() {
  const crops = [
    { name: 'Wheat (Kanak)', market: 'Khanna, Punjab', min: '₹2,125', max: '₹2,350', modal: '₹2,275', trend: 1.5, icon: Wheat, color: 'bg-yellow-100 text-yellow-700' },
    { name: 'Basmati Rice', market: 'Karnal, Haryana', min: '₹4,200', max: '₹4,850', modal: '₹4,600', trend: -0.8, icon: Sprout, color: 'bg-orange-100 text-orange-700' },
    { name: 'Cotton (Narma)', market: 'Bathinda, Punjab', min: '₹7,100', max: '₹7,800', modal: '₹7,540', trend: 2.1, icon: Cloud, color: 'bg-slate-100 text-slate-700' },
    { name: 'Potato', market: 'Agra, UP', min: '₹850', max: '₹1,150', modal: '₹1,020', trend: 0.0, icon: CircleDot, color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="p-8">
        {/* Page Title & Quick Filters */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight">Live Mandi Rates</h3>
            <p className="text-slate-500 mt-1">Real-time updates from 1,500+ markets across India</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'State: Punjab', icon: MapPin },
              { label: 'Mandi: Khanna', icon: Store },
              { label: 'Today', icon: Calendar },
            ].map((filter, i) => (
              <button key={i} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-emerald-100 text-sm font-medium hover:bg-slate-50 transition-colors">
                <filter.icon size={16} className="text-emerald-600" />
                {filter.label}
                <ChevronRight size={14} className="text-slate-400 rotate-90" />
              </button>
            ))}
          </div>
        </div>

        {/* Price Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Most Volatile', value: 'Tomato', price: '₹3,450', trend: '-12.4%', up: false },
            { label: 'Top Performer', value: 'Mustard Seed', price: '₹5,120', trend: '+4.2%', up: true },
            { label: 'Market Sentiment', value: 'Bullish', custom: (
              <div className="flex items-center mt-3 gap-2">
                <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full w-[65%]"></div>
                </div>
                <span className="text-sm font-bold text-emerald-600">65% Up</span>
              </div>
            )},
            { label: 'Arrivals (Khanna)', value: '12,400 MT', sub: 'Daily Avg: 10k MT', badge: 'Above Normal' },
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-emerald-50">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
              <h4 className="text-lg font-bold">{card.value}</h4>
              {card.price ? (
                <div className="flex items-center justify-between mt-3">
                  <span className="text-2xl font-black text-slate-900">{card.price}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${card.up ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {card.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {card.trend}
                  </span>
                </div>
              ) : card.custom ? card.custom : (
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400 font-medium">{card.sub}</span>
                  <span className="text-emerald-600 text-xs font-bold">{card.badge}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detailed Price List */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 overflow-hidden">
          <div className="p-6 border-b border-emerald-50 flex items-center justify-between">
            <h4 className="font-bold text-lg">Crop Prices Per Quintal (100kg)</h4>
            <button className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline">
              <Download size={16} /> Export Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Crop Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Market / Mandi</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Min Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Max Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Modal Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trend (7d)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Historical Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {crops.map((crop, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded flex items-center justify-center ${crop.color}`}>
                          <crop.icon size={18} />
                        </div>
                        <span className="font-bold">{crop.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{crop.market}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">{crop.min}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">{crop.max}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-base font-bold text-slate-900">{crop.modal}</span>
                    </td>
                    <td className="px-6 py-4">
                      {crop.trend > 0 ? (
                        <span className="text-emerald-600 text-sm font-bold flex items-center gap-1">
                          <TrendingUp size={14} /> {crop.trend}%
                        </span>
                      ) : crop.trend < 0 ? (
                        <span className="text-red-600 text-sm font-bold flex items-center gap-1">
                          <TrendingDown size={14} /> {Math.abs(crop.trend)}%
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm font-bold flex items-center gap-1">
                          <Minus size={14} /> 0.0%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-end gap-0.5 h-6">
                        {[2, 3, 4, 3, 5, 6].map((h, j) => (
                          <div 
                            key={j} 
                            className={`w-2 rounded-t-sm ${j === 5 ? 'bg-emerald-600' : 'bg-emerald-600/30'}`} 
                            style={{ height: `${h * 4}px` }}
                          ></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-emerald-50">
            <span className="text-sm text-slate-500">Showing 1-10 of 24 crops found</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-white border border-emerald-100 rounded-lg text-sm disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm">1</button>
              <button className="px-3 py-1 bg-white border border-emerald-100 rounded-lg text-sm">2</button>
              <button className="px-3 py-1 bg-white border border-emerald-100 rounded-lg text-sm">3</button>
              <button className="px-3 py-1 bg-white border border-emerald-100 rounded-lg text-sm">Next</button>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-50">
            <h4 className="font-bold text-lg mb-4">Price Trend Analysis</h4>
            <div className="relative h-64 w-full bg-slate-50 rounded-lg overflow-hidden flex flex-col justify-end p-4 border border-dashed border-emerald-200">
              <div className="flex items-end justify-between w-full h-full pb-4">
                {[30, 45, 40, 60, 75, 70, 85, 100].map((h, i) => (
                  <div key={i} className={`w-8 rounded-t-md ${i === 7 ? 'bg-emerald-600' : 'bg-emerald-600/40'}`} style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
              </div>
              <div className="absolute top-4 right-4 flex gap-3">
                <div className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-600"></span>
                  <span className="text-[10px] font-bold">Current Year</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-slate-300"></span>
                  <span className="text-[10px] font-bold">Last Year</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed">
              <span className="font-bold text-emerald-600">Analysis:</span> Wheat prices are projected to rise by another 5-7% next month due to lower arrivals in key northern markets. Consider selling surplus inventory.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-50">
            <h4 className="font-bold text-lg mb-4">Market News & Alerts</h4>
            <div className="space-y-4">
              {[
                { title: 'Government MSP Increase', desc: 'New MSP for Kharif crops announced. Paddy sees a hike of ₹143 per quintal.', time: '2 hours ago', icon: Bell },
                { title: 'Heavy Inflow at Khanna Mandi', desc: 'High arrivals causing temporary price stabilization in mustard seed trades.', time: '5 hours ago', icon: TrendingUp },
                { title: 'Export Demand Spike', desc: 'Increased demand from Southeast Asia for Basmati rice exports expected to push prices.', time: 'Yesterday', icon: TrendingUp },
              ].map((news, i) => (
                <div key={i} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 size-12 bg-white rounded flex items-center justify-center text-emerald-600">
                    <news.icon size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold">{news.title}</h5>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{news.desc}</p>
                    <span className="text-[10px] text-emerald-600 font-bold mt-2 inline-block">{news.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
