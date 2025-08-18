import React, { useState, useEffect } from "react";
import { currencyFormat } from "helpers/currency";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendUp, CurrencyDollar } from "phosphor-react";
import { useQuery } from "@tanstack/react-query";

interface ChartWithSummaryProps {
  summary: {
    overdueAmount: number | string;
    outstandingAmount: number | string;
    draftAmount: number | string;
  };
  baseCurrency: string;
  filterParams: any;
  setFilterParams: (params: any) => void;
}

const ChartWithSummary: React.FC<ChartWithSummaryProps> = ({
  summary,
  baseCurrency,
  filterParams,
  setFilterParams,
}) => {
  const [revenueData, setRevenueData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [growthRate, setGrowthRate] = useState(0);
  const [monthlyAvg, setMonthlyAvg] = useState(0);

  // Fetch real invoice data from dashboard API
  const { data: monthlyInvoices } = useQuery({
    queryKey: ["dashboard", "revenue", selectedPeriod],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/v1/dashboard?timeframe=${selectedPeriod}`, {
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": document.querySelector('[name="csrf-token"]')?.getAttribute("content") || "",
          },
          credentials: "include",
        });

        if (!response.ok) {
          console.warn('Dashboard API error, using fallback data');
          return { 
            monthlyData: [], 
            growth: 0, 
            avg: 0, 
            totalRevenue: 0 
          };
        }

        const data = await response.json();
        const revenueChart = data.revenue_chart || [];
        
        // Transform the data to match our chart format
        const monthlyData = revenueChart.map(item => ({
          month: item.label || item.month || item.name,
          revenue: item.value || item.revenue || item.amount || 0,
          paid: item.paid || item.value || 0,
          pending: item.pending || 0
        }));
        
        // Calculate totals and growth
        const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
        const avg = monthlyData.length > 0 ? totalRevenue / monthlyData.length : 0;
        
        // Calculate growth from stats if available
        const growth = data.stats?.revenue_trend || 0;
        
        return { monthlyData, growth, avg, totalRevenue };
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return { 
          monthlyData: [], 
          growth: 0, 
          avg: 0, 
          totalRevenue: 0 
        };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (monthlyInvoices) {
      setRevenueData(monthlyInvoices.monthlyData || []);
      setGrowthRate(typeof monthlyInvoices.growth === 'number' ? monthlyInvoices.growth : 0);
      setMonthlyAvg(typeof monthlyInvoices.avg === 'number' ? monthlyInvoices.avg : 0);
    }
  }, [monthlyInvoices]);

  const applyFilter = (status: any) => {
    setFilterParams({
      ...filterParams,
      status,
    });
  };

  const resetFilters = () => {
    setFilterParams({
      ...filterParams,
      status: [],
    });
  };

  // Parse values to ensure they're numbers
  const parseAmount = (value: number | string): number => {
    if (typeof value === "number") return value;
    const parsed = parseFloat(value.toString());

    return isNaN(parsed) ? 0 : parsed;
  };

  const overdueAmount = parseAmount(summary.overdueAmount);
  const outstandingAmount = parseAmount(summary.outstandingAmount);
  const draftAmount = parseAmount(summary.draftAmount);
  const totalAmount = overdueAmount + outstandingAmount + draftAmount;

  const summaryItems = [
    {
      label: "All",
      value: totalAmount,
      colorClass: "text-gray-700",
      bgClass: "bg-gray-50 hover:bg-gray-100",
      onClick: resetFilters,
      isReset: true,
    },
    {
      label: "Overdue",
      value: overdueAmount,
      colorClass: "text-gray-700",
      bgClass: "bg-gray-50 hover:bg-gray-100",
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      label: "Outstanding",
      value: outstandingAmount,
      colorClass: "text-gray-700",
      bgClass: "bg-gray-50 hover:bg-gray-100",
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
          { value: "overdue", label: "OVERDUE" },
        ]),
    },
    {
      label: "Draft",
      value: draftAmount,
      colorClass: "text-gray-600",
      bgClass: "bg-gray-50 hover:bg-gray-100",
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  const revenueFilters = [
    { label: "Monthly", value: "month", icon: Calendar },
    { label: "Quarterly", value: "quarter", icon: TrendUp },
    { label: "Yearly", value: "year", icon: CurrencyDollar },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">{`${label} ${new Date().getFullYear()}`}</p>
          <div className="space-y-1">
            {payload.map((pld, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">{pld.dataKey}:</span>
                <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {currencyFormat(baseCurrency, pld.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6 mb-8">
      {/* Main container with chart (70%) and stats (30%) */}
      <div className="flex gap-4">
        {/* Revenue Chart - 70% width */}
        <div className="flex-1" style={{ flex: '0 0 70%' }}>
        <div className="border shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-xl overflow-hidden">
          <div className="border-b border-gray-200 p-5 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Yearly Revenue
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Monthly revenue breakdown
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                  <TrendUp className={`w-4 h-4 ${growthRate > 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm font-semibold ${growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growthRate > 0 ? '+' : ''}{(typeof growthRate === 'number' ? growthRate : 0).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs last year</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="invoiceColorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="invoiceStrokeRevenue" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <filter id="invoiceShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                      <feOffset dx="0" dy="4" result="offsetblur"/>
                      <feFlood floodColor="#6366f1" floodOpacity="0.15"/>
                      <feComposite in2="offsetblur" operator="in"/>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    vertical={false} 
                    stroke="#e5e7eb" 
                    strokeDasharray="0" 
                    strokeOpacity={0.5}
                  />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    domain={[0, 'dataMax + 5000']}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="url(#invoiceStrokeRevenue)"
                    strokeWidth={2}
                    fill="url(#invoiceColorRevenue)"
                    dot={{ 
                      fill: '#6366f1', 
                      strokeWidth: 1, 
                      r: 2,
                      stroke: '#ffffff'
                    }}
                    activeDot={{ 
                      r: 4, 
                      strokeWidth: 2,
                      stroke: '#ffffff',
                      fill: '#6366f1'
                    }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Additional Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Avg</p>
                <p className="text-base font-bold text-gray-900">
                  {currencyFormat(baseCurrency, monthlyAvg)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Peak Month</p>
                <p className="text-base font-bold text-gray-900">
                  {revenueData.reduce((max, item) => item.revenue > max.revenue ? item : max, revenueData[0] || {revenue: 0})?.month || '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Invoices</p>
                <p className="text-base font-bold text-gray-900">
                  {revenueData.reduce((sum, item) => sum + (item.invoices || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Summary Cards - 30% width, vertical layout */}
        <div className="flex flex-col gap-3" style={{ flex: '0 0 30%' }}>
          {summaryItems.map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`${item.bgClass} rounded-xl p-4 text-left transition-all duration-200 border border-gray-200 hover:shadow-lg hover:scale-[1.02] flex-1`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                    {item.label}
                  </p>
                  <p className={`text-xl font-bold ${item.colorClass}`}>
                    {currencyFormat(baseCurrency, item.value)}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartWithSummary;
