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
      setGrowthRate(monthlyInvoices.growth || 0);
      setMonthlyAvg(monthlyInvoices.avg || 0);
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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label} ${new Date().getFullYear()}`}</p>
          {payload.map((pld, index) => (
            <p key={index} className="text-sm" style={{ color: pld.color }}>
              {`${pld.dataKey}: ${currencyFormat(baseCurrency, pld.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6 mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryItems.map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`${item.bgClass} rounded-lg p-4 text-left transition-all duration-200 border border-gray-200 hover:shadow-sm`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                  {item.label}
                </p>
                <p className={`text-2xl font-bold ${item.colorClass}`}>
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

      {/* Revenue Chart - Full Width */}
      <div className="w-full">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Yearly Revenue</h3>
                <p className="text-sm text-gray-500">Track your revenue performance over time</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendUp className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">
                  {growthRate > 0 ? '+' : ''}{growthRate}% vs last year
                </span>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#9ca3af" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ChartWithSummary;
