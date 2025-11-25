import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ad, AdsResponse, Filters } from '../types';
import './AdsList.css';

const API_BASE = 'http://localhost:3001/api/v1';

const AdsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<Filters>({
    status: searchParams.getAll('status') || [],
    categoryId: searchParams.get('categoryId') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAds();
    // eslint-disable-next-line
  }, [page, filters]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/ads?page=1&limit=150`);
      const data: AdsResponse = await response.json();
      const uniqueCategories = [...new Set(data.ads.map(ad => ad.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });

      // Добавляем остальные фильтры
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'status' && value) {
          params.set(key, String(value));
        }
      });
      
      // Множественный статус
      if (filters.status.length > 0) {
        filters.status.forEach(s => params.append('status', s));
      }

      const response = await fetch(`${API_BASE}/ads?${params}`);
      const data: AdsResponse = await response.json();
      
      setAds(data.ads || []);
      setPage(data.pagination?.currentPage || 1);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (key: keyof Filters, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
    
    // Синхронизация с URL
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach(item => params.append(k, item));
      } else if (v) {
        params.set(k, String(v));
      }
    });
    setSearchParams(params);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(o => o.value);
    updateFilters('status', selectedOptions);
  };

  const resetFilters = () => {
    setFilters({
      status: [],
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchParams({});
    setPage(1);
  };

  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'На модерации',
      approved: 'Одобрено',
      rejected: 'Отклонено',
      draft: 'На доработке'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="ads-list-container">
      <div className="ads-list-wrapper">
        <div className="card filters-card">
          <h2>Фильтры</h2>
          
          <div className="filter-group">
            <label>Статус (множественный выбор):</label>
            <select 
              multiple 
              value={filters.status}
              onChange={handleStatusChange}
              className="form-control"
            >
              <option value="pending">На модерации</option>
              <option value="approved">Одобрено</option>
              <option value="rejected">Отклонено</option>
              <option value="draft">На доработке</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Категория:</label>
            <select 
              value={filters.categoryId}
              onChange={(e) => updateFilters('categoryId', e.target.value)}
              className="form-control"
            >
              <option value="">Все категории</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={String(idx)}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Цена от:</label>
            <input 
              type="number"
              value={filters.minPrice}
              onChange={(e) => updateFilters('minPrice', e.target.value)}
              placeholder="Минимум"
              className="form-control"
            />
          </div>

          <div className="filter-group">
            <label>Цена до:</label>
            <input 
              type="number"
              value={filters.maxPrice}
              onChange={(e) => updateFilters('maxPrice', e.target.value)}
              placeholder="Максимум"
              className="form-control"
            />
          </div>

          <div className="filter-group">
            <label>Поиск по названию:</label>
            <input 
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters('search', e.target.value)}
              placeholder="Введите название"
              className="form-control"
            />
          </div>

          <div className="filter-group">
            <label>Сортировка:</label>
            <select 
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters({...filters, sortBy, sortOrder});
              }}
              className="form-control"
            >
              <option value="createdAt-desc">Дата (новые → старые)</option>
              <option value="createdAt-asc">Дата (старые → новые)</option>
              <option value="price-desc">Цена (убывание)</option>
              <option value="price-asc">Цена (возрастание)</option>
              <option value="priority-desc">Приоритет</option>
            </select>
          </div>

          <button onClick={resetFilters} className="btn btn-secondary" style={{width: '100%'}}>
            Сбросить фильтры
          </button>
        </div>

        <div className="ads-list-main">
          <div className="card">
            <div className="ads-list-header">
              <h2>Список объявлений</h2>
              <span className="ads-count">Всего: {totalItems} объявлений</span>
            </div>

            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : (
              <>
                <div className="ads-grid">
                  {ads.map(ad => (
                    <div key={ad.id} className="ad-card" onClick={() => navigate(`/item/${ad.id}`)}>
                      <img 
                        src={ad.images[0]} 
                        alt={ad.title}
                        className="ad-image"
                      />
                      <div className="ad-content">
                        <h3 className="ad-title">{ad.title}</h3>
                        <div className="ad-price">{ad.price.toLocaleString('ru-RU')} ₽</div>
                        <div className="ad-meta">
                          <span className="ad-category">{ad.category}</span>
                          <span className="ad-date">{new Date(ad.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <div className="ad-badges">
                          <span className={`status-badge status-${ad.status}`}>
                            {translateStatus(ad.status)}
                          </span>
                          {ad.priority === 'urgent' && (
                            <span className="priority-badge">Срочно</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsList;
