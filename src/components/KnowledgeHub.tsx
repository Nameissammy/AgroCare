import React from 'react';
import { 
  Search, 
  Bell, 
  Bookmark, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  Leaf,
  Brain,
  Landmark,
  TrendingUp,
  Dog,
  Sun,
  Sprout,
  GraduationCap,
  ShieldCheck,
  Settings as SettingsIcon
} from 'lucide-react';
import { motion } from 'motion/react';

export default function KnowledgeHub() {
  const categories = [
    'All Topics', 'Crop Management', 'Sustainable Farming', 'Government Schemes', 'Market Trends', 'Livestock'
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Featured Hero */}
        <section>
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-slate-900 aspect-[21/9] flex flex-col justify-end p-8 group cursor-pointer"
          >
            <div 
              className="absolute inset-0 opacity-60 transition-transform duration-700 group-hover:scale-105 bg-cover bg-center" 
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=1200&h=600&fit=crop')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
            <div className="relative space-y-3 max-w-2xl">
              <div className="inline-block px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded">Featured Topic</div>
              <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">Modern Smart Irrigation Techniques for 2024</h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">Maximize crop yield while reducing water waste by up to 40% using IoT-based monitoring systems and precision drip methods.</p>
              <div className="flex items-center gap-4 pt-2">
                <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-all">Read Full Guide</button>
                <span className="text-slate-400 text-xs flex items-center gap-1"><Clock size={14} /> 12 min read</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Filters */}
        <section className="flex flex-wrap gap-2 py-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat, i) => (
            <button 
              key={i}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                i === 0 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white border border-emerald-100 text-slate-600 hover:border-emerald-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Crop Management Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="text-emerald-600" size={20} />
              <h4 className="text-xl font-bold">Crop Management</h4>
            </div>
            <button className="text-emerald-600 text-sm font-bold flex items-center hover:underline">
              View All <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Optimizing Wheat Yield in Arid Climates', level: 'Beginner', time: '8 min read', img: 'https://images.unsplash.com/photo-1501430654243-c93fceaaf31c?w=400&h=300&fit=crop' },
              { title: 'Integrated Pest Management (IPM) 101', level: 'Intermediate', time: '15 min read', img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400&h=300&fit=crop' },
              { title: 'Precision Soil Sensing & Mapping', level: 'Advanced', time: '22 min read', img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop' },
            ].map((article, i) => (
              <article key={i} className="bg-white rounded-xl border border-emerald-50 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img src={article.img} alt={article.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      article.level === 'Beginner' ? 'bg-emerald-100 text-emerald-700' :
                      article.level === 'Intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {article.level}
                    </span>
                    <span className="text-[10px] text-slate-400">{article.time}</span>
                  </div>
                  <h5 className="font-bold text-lg leading-tight">{article.title}</h5>
                  <p className="text-slate-500 text-sm line-clamp-2">A comprehensive guide on soil preparation and seed selection for high-yield cultivation.</p>
                  <div className="pt-2 flex items-center justify-between">
                    <button className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                      Read More <ArrowRight size={16} />
                    </button>
                    <button className="text-slate-400 hover:text-emerald-600"><Bookmark size={18} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Sustainable Farming */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="text-emerald-600" size={20} />
              <h4 className="text-xl font-bold">Sustainable Farming</h4>
            </div>
            <button className="text-emerald-600 text-sm font-bold flex items-center hover:underline">
              View All <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { title: 'Solar Energy for Remote Water Pumps', category: 'Ecology', time: '6 min read', level: 'Beginner', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop' },
              { title: 'Crop Rotation Masterclass', category: 'Organic', time: '12 min read', level: 'Intermediate', img: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=300&fit=crop' },
            ].map((article, i) => (
              <div key={i} className="flex bg-white rounded-xl border border-emerald-50 overflow-hidden group">
                <div className="w-1/3 shrink-0 relative overflow-hidden">
                  <img src={article.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={article.title} />
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-emerald-600 mb-2">{article.category}</span>
                  <h5 className="font-bold text-lg mb-2">{article.title}</h5>
                  <p className="text-slate-500 text-sm mb-4">A practical guide on transitioning your farming systems to sustainable methods.</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                    <span>{article.time}</span>
                    <span className="size-1 bg-slate-400 rounded-full"></span>
                    <span>{article.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Government Schemes */}
        <section className="space-y-6 pt-4 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="text-emerald-600" size={20} />
              <h4 className="text-xl font-bold">Government Schemes & Subsidies</h4>
            </div>
            <button className="text-emerald-600 text-sm font-bold flex items-center hover:underline">
              View All <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Agri-Credit Support 2024', desc: 'Low-interest loans for small-scale organic farmers. Deadline: June 30.', icon: TrendingUp },
              { title: 'Crop Insurance Program', desc: 'Protect your harvest against extreme weather with 80% subsidy.', icon: ShieldCheck },
              { title: 'Equipment Subsidy Scheme', desc: 'Get up to 50% back on new harvesters and smart irrigation.', icon: SettingsIcon },
              { title: 'Youth Farming Grant', desc: 'Educational grants and land access for farmers under 35.', icon: GraduationCap },
            ].map((scheme, i) => (
              <div key={i} className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
                <div className="size-10 bg-emerald-600 text-white flex items-center justify-center rounded-lg">
                  <scheme.icon size={20} />
                </div>
                <h5 className="font-bold text-sm">{scheme.title}</h5>
                <p className="text-slate-500 text-xs leading-relaxed">{scheme.desc}</p>
                <button className="text-emerald-600 text-xs font-bold uppercase tracking-wider hover:underline">Learn More</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

