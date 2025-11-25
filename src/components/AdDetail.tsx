import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ad } from '../types';
import './AdDetail.css';

const API_BASE = 'http://localhost:3001/api/v1';

const AdDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  
  const [rejectData, setRejectData] = useState({
    reasons: [] as string[],
    otherReason: '',
    comment: ''
  });

  useEffect(() => {
    if (id) {
      fetchAd();
      fetchAllAds();
    }
  }, [id]);

  const fetchAd = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ads/${id}`);
      const data: Ad = await response.json();
      setAd(data);
    } catch (error) {
      console.error('Ошибка загрузки объявления:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAds = async () => {
    try {
      const response = await fetch(`${API_BASE}/ads?page=1&limit=150`);
      const data = await response.json();
      setAllAds(data.ads || []);
    } catch (error) {
      console.error('Ошибка загрузки списка объявлений:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await fetch(`${API_BASE}/ads/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      fetchAd();
    } catch (error) {
      console.error('Ошибка одобрения:', error);
    }
  };

  const handleReject = async () => {
    const reason = rejectData.reasons.includes('Другое') 
      ? rejectData.otherReason 
      : rejectData.reasons.join(', ');
    
    if (!reason) {
      alert('Укажите причину отклонения!');
      return;
    }

    try {
      await fetch(`${API_BASE}/ads/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, comment: rejectData.comment })
      });
      setShowRejectForm(false);
      setRejectData({ reasons: [], otherReason: '', comment: '' });
      fetchAd();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
    }
  };

  const handleRequestChanges = async () => {
    const reason = rejectData.reasons.includes('Другое') 
      ? rejectData.otherReason 
      : rejectData.reasons.join(', ');
    
    if (!reason) {
      alert('Укажите причину запроса изменений!');
      return;
    }

    try {
      await fetch(`${API_BASE}/ads/${id}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, comment: rejectData.comment })
      });
      setShowDraftForm(false);
      setRejectData({ reasons: [], otherReason: '', comment: '' });
      fetchAd();
    } catch (error) {
      console.error('Ошибка запроса изменений:', error);
    }
  };

  const navigateToAd = (offset: number) => {
    if (!id) return;
    const currentIndex = allAds.findIndex(a => a.id === parseInt(id));
    const newIndex = currentIndex + offset;
    if (newIndex >= 0 && newIndex < allAds.length) {
      navigate(`/item/${allAds[newIndex].id}`);
    }
  };

  const toggleReason = (reason: string) => {
    setRejectData(prev => ({
      ...prev,
      reasons: prev.reasons.includes(reason)
        ? prev.reasons.filter(r => r !== reason)
        : [...prev.reasons, reason]
    }));
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

  const translateAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      approved: 'Одобрено',
      rejected: 'Отклонено',
      requestChanges: 'На доработке'
    };
    return actionMap[action] || action;
  };

  if (loading) {
    return <div className="loading-container">Загрузка...</div>;
  }

  if (!ad) {
    return <div className="error-container">Объявление не найдено</div>;
  }

  return (
    <div className="ad-detail-container">
      <div className="ad-detail-wrapper">
        <div className="ad-detail-header">
          <button onClick={() => navigate('/list')} className="btn btn-secondary">
            ← Назад к списку
          </button>
          <div className="nav-buttons">
            <button onClick={() => navigateToAd(-1)} className="btn btn-secondary">
              ← Предыдущее
            </button>
            <button onClick={() => navigateToAd(1)} className="btn btn-secondary">
              Следующее →
            </button>
          </div>
        </div>

        <div className="ad-detail-content">
          <div className="ad-detail-main">
            <div className="card">
              <div className="image-gallery">
                {ad.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`Фото ${idx + 1}`} className="gallery-img" />
                ))}
              </div>

              <h1 className="ad-detail-title">{ad.title}</h1>
              
              <div className="ad-detail-price">{ad.price.toLocaleString('ru-RU')} ₽</div>
              
              <div className="ad-detail-badges">
                <span className={`status-badge status-${ad.status}`}>
                  {translateStatus(ad.status)}
                </span>
                {ad.priority === 'urgent' && (
                  <span className="priority-badge">Срочно</span>
                )}
              </div>

              <div className="ad-detail-section">
                <h3>Описание</h3>
                <p>{ad.description}</p>
              </div>

              <div className="ad-detail-section">
                <h3>Характеристики</h3>
                <table className="characteristics-table">
                  <tbody>
                    {Object.entries(ad.characteristics).map(([key, value]) => (
                      <tr key={key}>
                        <td className="char-key">{key}</td>
                        <td className="char-value">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ad-detail-section">
                <h3>Информация о продавце</h3>
                <div className="seller-info">
                  <div className="seller-item">
                    <span className="seller-label">Имя:</span>
                    <span className="seller-value">{ad.seller.name}</span>
                  </div>
                  <div className="seller-item">
                    <span className="seller-label">Рейтинг:</span>
                    <span className="seller-value">{ad.seller.rating}</span>
                  </div>
                  <div className="seller-item">
                    <span className="seller-label">Объявлений:</span>
                    <span className="seller-value">{ad.seller.totalAds}</span>
                  </div>
                  <div className="seller-item">
                    <span className="seller-label">Дата регистрации:</span>
                    <span className="seller-value">
                      {new Date(ad.seller.registeredAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ad-detail-section">
                <h3>История модерации</h3>
                {ad.moderationHistory && ad.moderationHistory.length > 0 ? (
                  <div className="moderation-history">
                    {ad.moderationHistory.map((item) => (
                      <div key={item.id} className="history-item">
                        <div className="history-header">
                          <span className="history-date">
                            {new Date(item.timestamp).toLocaleString('ru-RU')}
                          </span>
                          <span className="history-moderator">{item.moderatorName}</span>
                          <span className={`history-action action-${item.action}`}>
                            {translateAction(item.action)}
                          </span>
                        </div>
                        {item.reason && (
                          <div className="history-reason">
                            <strong>Причина:</strong> {item.reason}
                          </div>
                        )}
                        {item.comment && (
                          <div className="history-comment">{item.comment}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-history">Объявление ещё не модерировалось</p>
                )}
              </div>

              <div className="moderation-actions">
                <button
                  onClick={handleApprove}
                  disabled={ad.status === 'approved'}
                  className="btn btn-success"
                >
                  ✓ Одобрить
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(!showRejectForm);
                    setShowDraftForm(false);
                  }}
                  disabled={ad.status === 'rejected'}
                  className="btn btn-danger"
                >
                  ✗ Отклонить
                </button>
                <button
                  onClick={() => {
                    setShowDraftForm(!showDraftForm);
                    setShowRejectForm(false);
                  }}
                  disabled={ad.status === 'draft'}
                  className="btn btn-warning"
                >
                  ⟲ На доработку
                </button>
              </div>

              {showRejectForm && (
                <div className="moderation-form reject-form">
                  <h4>Причина отклонения</h4>
                  <div className="reasons-list">
                    {['Запрещённый товар', 'Неверная категория', 'Некорректное описание', 
                      'Проблемы с фото', 'Подозрение на мошенничество', 'Другое'].map(reason => (
                      <label key={reason} className="reason-checkbox">
                        <input
                          type="checkbox"
                          checked={rejectData.reasons.includes(reason)}
                          onChange={() => toggleReason(reason)}
                        />
                        {reason}
                      </label>
                    ))}
                  </div>
                  {rejectData.reasons.includes('Другое') && (
                    <input
                      type="text"
                      placeholder="Укажите причину"
                      value={rejectData.otherReason}
                      onChange={(e) => setRejectData({ ...rejectData, otherReason: e.target.value })}
                      className="form-control"
                    />
                  )}
                  <textarea
                    placeholder="Комментарий (необязательно)"
                    value={rejectData.comment}
                    onChange={(e) => setRejectData({ ...rejectData, comment: e.target.value })}
                    className="form-control"
                    rows={3}
                  />
                  <button onClick={handleReject} className="btn btn-danger">
                    Отправить
                  </button>
                </div>
              )}

              {showDraftForm && (
                <div className="moderation-form draft-form">
                  <h4>Причина отправки на доработку</h4>
                  <div className="reasons-list">
                    {['Некорректное описание', 'Проблемы с фото', 
                      'Подозрение на мошенничество', 'Другое'].map(reason => (
                      <label key={reason} className="reason-checkbox">
                        <input
                          type="checkbox"
                          checked={rejectData.reasons.includes(reason)}
                          onChange={() => toggleReason(reason)}
                        />
                        {reason}
                      </label>
                    ))}
                  </div>
                  {rejectData.reasons.includes('Другое') && (
                    <input
                      type="text"
                      placeholder="Укажите причину"
                      value={rejectData.otherReason}
                      onChange={(e) => setRejectData({ ...rejectData, otherReason: e.target.value })}
                      className="form-control"
                    />
                  )}
                  <textarea
                    placeholder="Комментарий (необязательно)"
                    value={rejectData.comment}
                    onChange={(e) => setRejectData({ ...rejectData, comment: e.target.value })}
                    className="form-control"
                    rows={3}
                  />
                  <button onClick={handleRequestChanges} className="btn btn-warning">
                    Отправить
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetail;
