import React, { useEffect, useMemo, useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type MandiRecord = {
  state: string;
  market: string;
  commodity: string;
  arrivalDate: string;
  minPriceFormatted: string;
  maxPriceFormatted: string;
  modalPriceFormatted: string;
};

type TrendPoint = {
  date: string;
  modalPrice: number;
};

type ApiResponse = {
  records: MandiRecord[];
  states: string[];
  commodities: string[];
  trend: TrendPoint[];
};

const formatTrendDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function MandiPrices() {
  const [stateFilter, setStateFilter] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<MandiRecord[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchLivePrices = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({ limit: '200' });

        if (stateFilter) {
          params.append('state', stateFilter);
        }

        if (commodityFilter) {
          params.append('commodity', commodityFilter);
        }

        if (search.trim()) {
          params.append('search', search.trim());
        }

        const response = await fetch(`/api/mandi/prices?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to load mandi prices');
        }

        const data: ApiResponse = await response.json();

        setRecords(data.records || []);
        setStates(data.states || []);
        setCommodities(data.commodities || []);
        setTrend(data.trend || []);
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return;
        }

        setError('Unable to fetch live mandi prices right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchLivePrices();

    return () => controller.abort();
  }, [commodityFilter, search, stateFilter]);

  const chartData = useMemo(() => {
    return {
      labels: trend.map((point) => formatTrendDate(point.date)),
      datasets: [
        {
          label: 'Modal Price (₹/quintal)',
          data: trend.map((point) => point.modalPrice),
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
          pointBackgroundColor: '#059669',
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [trend]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          ticks: {
            callback: (value: string | number) => `₹${value}`,
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="p-8 space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight">Live Mandi Price Tracker</h3>
          <p className="text-slate-500 mt-1">Daily commodity prices from Agmarknet with quick filtering</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search crop name"
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All States</option>
              {states.map((stateItem) => (
                <option key={stateItem} value={stateItem}>
                  {stateItem}
                </option>
              ))}
            </select>

            <select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Commodities</option>
              {commodities.map((commodityItem) => (
                <option key={commodityItem} value={commodityItem}>
                  {commodityItem}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-50 flex items-center justify-between">
            <h4 className="font-bold text-lg">Daily Commodity Prices</h4>
            <span className="text-sm text-slate-500">{records.length} results</span>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-slate-500">Loading live Agmarknet prices...</div>
          ) : error ? (
            <div className="p-8 text-sm text-red-600">{error}</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">No records found for selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Commodity</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">State</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Market</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Min Price</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Max Price</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Modal Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {records.map((record, index) => (
                    <tr key={`${record.market}-${record.commodity}-${record.arrivalDate}-${index}`} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-semibold text-slate-800">{record.commodity}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{record.state}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{record.market}</td>
                      <td className="px-6 py-3 text-sm text-slate-700 text-right">{record.minPriceFormatted}</td>
                      <td className="px-6 py-3 text-sm text-slate-700 text-right">{record.maxPriceFormatted}</td>
                      <td className="px-6 py-3 text-sm font-bold text-slate-900 text-right">{record.modalPriceFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-emerald-600" />
            <h4 className="font-bold text-lg">7-Day Modal Price Trend</h4>
          </div>

          {trend.length === 0 ? (
            <p className="text-sm text-slate-500">Trend data is not available for the selected filters.</p>
          ) : (
            <div className="h-72">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
