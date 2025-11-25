import React, { useState, useEffect, useRef } from 'react';
import { StatsSummary, ActivityData, DecisionsData, CategoriesData } from '../types';
import './Stats.css';

const API_BASE = 'http://localhost:3001/api/v1';

const Stats: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [decisionsData, setDecisionsData] = useState<DecisionsData | null>(null);
  const [categoriesData, setCategoriesData] = useState<CategoriesData>({});
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchStats();
  }, [period]);

  useEffect(() => {
    if (decisionsData && canvasRef.current) {
      drawPieChart();
    }
  }, [decisionsData]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [summaryRes, activityRes, decisionsRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/stats/summary?period=${period}`),
        fetch(`${API_BASE}/stats/chart/activity?period=${period}`),
        fetch(`${API_BASE}/stats/chart/decisions?period=${period}`),
        fetch(`${API_BASE}/stats/chart/categories?period=${period}`)
      ]);

      const summaryData = await summaryRes.json();
      const activityDataRes = await activityRes.json();
      const decisionsDataRes = await decisionsRes.json();
      const categoriesDataRes = await categoriesRes.json();

      setSummary(summaryData);
      setActivityData(activityDataRes);
      setDecisionsData(decisionsDataRes);
      setCategoriesData(categoriesDataRes);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const drawPieChart = () => {
    if (!canvasRef.current || !decisionsData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = 100;
    const centerY = 100;
    const radius = 80;

    ctx.clearRect(0, 0, 200, 200);

    const total = decisionsData.approved + decisionsData.rejected + decisionsData.requestChanges;
    if (total === 0) return;

    const colors = [
      getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--color-warning').trim()
    ];

    const data = [decisionsData.approved, decisionsData.rejected, decisionsData.requestChanges];
    
    let currentAngle = -Math.PI / 2;

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index];
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const translatePeriod = (p: string): string => {
    const periodMap: Record<string, string> = {
      today: 'Сегодня',
      week: '7 дней',
      month: '30 дней'
    };
    return periodMap[p] || p;
  };

  if (loading) {
    return <div className="loading-container">Загрузка статистики...</div>;
  }

  return (
    <div className="stats-container">
      <div className="stats-wrapper">
        <div className="stats-header">
          <h1>Статистика модерации</h1>
          <div className="period-selector">
            <label>Период:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month')}
              className="form-control"
            >
              <option value="today">Сегодня</option>
              <option value="week">7 дней</option>
              <option value="month">30 дней</option>
            </select>
          </div>
        </div>

        {summary && (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Всего проверено</div>
              <div className="metric-value">{summary.totalReviewed}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Одобрено</div>
              <div className="metric-value success">{summary.approvedPercentage}%</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Отклонено</div>
              <div className="metric-value danger">{summary.rejectedPercentage}%</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Среднее время</div>
              <div className="metric-value">{(summary.averageReviewTime / 60).toFixed(1)} мин</div>
            </div>
          </div>
        )}

        <div className="charts-grid">
          <div className="card chart-card">
            <h3>График активности ({translatePeriod(period)})</h3>
            <div className="activity-chart">
              {activityData.length > 0 ? (
                <div className="activity-bars">
                  {activityData.map((day, index) => {
                    const total = day.approved + day.rejected + day.requestChanges;
                    const maxValue = Math.max(...activityData.map(d => 
                      d.approved + d.rejected + d.requestChanges
                    ), 1);
                    const height = (total / maxValue) * 100;
                    
                    return (
                      <div key={index} className="activity-bar-wrapper">
                        <div 
                          className="activity-bar" 
                          style={{ height: `${height}%` }}
                          title={`${new Date(day.date).toLocaleDateString('ru-RU')}: ${total}`}
                        >
                          <span className="bar-value">{total}</span>
                        </div>
                        <div className="bar-label">
                          {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-data">Нет данных за выбранный период</div>
              )}
            </div>
          </div>

          <div className="card chart-card">
            <h3>Распределение решений</h3>
            <div className="pie-chart-container">
              <canvas ref={canvasRef} width="200" height="200" className="pie-chart" />
              {decisionsData && (
                <div className="pie-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: 'var(--color-success)' }}></span>
                    <span>Одобрено: {decisionsData.approved}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: 'var(--color-danger)' }}></span>
                    <span>Отклонено: {decisionsData.rejected}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: 'var(--color-warning)' }}></span>
                    <span>На доработку: {decisionsData.requestChanges}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card chart-card">
            <h3>Категории объявлений</h3>
            <div className="categories-list">
              {Object.entries(categoriesData)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} className="category-item">
                    <span className="category-name">{category}</span>
                    <span className="category-count">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
