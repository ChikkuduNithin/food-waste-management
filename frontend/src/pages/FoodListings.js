import React, { useState, useEffect, useCallback } from 'react';
import { foodAPI, requestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Badge, Alert, Modal, EmptyState, Pagination, formatDate } from '../components/Shared';

const RequestModal = ({ food, onClose, onSuccess }) => {
  const [form, setForm] = useState({ message: '', pickupTime: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await requestAPI.create({ foodId: food._id, message: form.message, pickupTime: form.pickupTime || undefined });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Request: ${food.title}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : '📬 Submit Request'}
          </button>
        </>
      }
    >
      {error && <Alert type="error">{error}</Alert>}
      <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
          <strong>Quantity:</strong> {food.quantity} &nbsp;·&nbsp;
          <strong>Category:</strong> {food.category} &nbsp;·&nbsp;
          <strong>Expires:</strong> {formatDate(food.expiryTime)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>
          <strong>Donor:</strong> {food.donor?.name}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Message to Donor (optional)</label>
        <textarea
          className="form-textarea"
          placeholder="Explain why you need this food, how many people it will serve, etc."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Preferred Pickup Time (optional)</label>
        <input
          className="form-input" type="datetime-local"
          value={form.pickupTime} onChange={(e) => setForm({ ...form, pickupTime: e.target.value })}
        />
      </div>
    </Modal>
  );
};

const FoodListings = () => {
  const { isNGO, isDonor } = useAuth();
  const [foods, setFoods] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ status: isDonor ? '' : 'available', category: '', page: 1 });
  const [requestTarget, setRequestTarget] = useState(null);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: 9 };
      if (!params.status) delete params.status;
      if (!params.category) delete params.category;
      const res = await foodAPI.getAll(params);
      setFoods(res.data.data.foods);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load food listings.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  const handleRequestSuccess = () => {
    setRequestTarget(null);
    setSuccess('Request submitted! The donor will be notified.');
    fetchFoods();
    setTimeout(() => setSuccess(''), 4000);
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>🍱 Food Listings</h1>
          <p>{isNGO ? 'Browse available food from donors near you' : 'All food listings on the platform'}</p>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="filters-bar">
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All Statuses</option>
          <option value="available">✅ Available</option>
          <option value="requested">🟡 Requested</option>
          <option value="completed">🔵 Completed</option>
          <option value="expired">⚫ Expired</option>
        </select>
        <select
          className="form-select"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
        >
          <option value="">All Categories</option>
          <option value="cooked">🍲 Cooked</option>
          <option value="raw">🥦 Raw</option>
          <option value="packaged">📦 Packaged</option>
          <option value="beverages">🧃 Beverages</option>
          <option value="other">📋 Other</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: isNGO ? 'available' : '', category: '', page: 1 })}>
          ↺ Reset
        </button>
        {pagination && (
          <span className="text-sm text-gray" style={{ marginLeft: 'auto' }}>
            {pagination.total} listing{pagination.total !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : foods.length === 0 ? (
        <EmptyState icon="🍽️" message="No food listings match your filters." />
      ) : (
        <>
          <div className="food-grid">
            {foods.map((food) => (
              <div className="food-card" key={food._id}>
                <div className="food-card-header">
                  <div>
                    <div className="food-card-title">{food.title}</div>
                    <div className="food-card-donor">by {food.donor?.name}</div>
                  </div>
                  <Badge status={food.status} />
                </div>
                <div className="food-card-body">
                  <div className="food-card-meta">
                    <div className="meta-item">
                      <span className="meta-label">Quantity</span>
                      <span className="meta-value">🍽️ {food.quantity}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Category</span>
                      <span className="meta-value">{food.category}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Expires</span>
                      <span className="meta-value" style={{ color: new Date(food.expiryTime) < new Date() ? 'var(--red-500)' : 'inherit' }}>
                        📅 {formatDate(food.expiryTime)}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Location</span>
                      <span className="meta-value">
                        📍 {food.location?.lat?.toFixed(3)}, {food.location?.lng?.toFixed(3)}
                      </span>
                    </div>
                  </div>
                  {food.description && (
                    <div className="food-card-desc">{food.description}</div>
                  )}
                  {food.location?.address && (
                    <div className="food-card-location">📍 {food.location.address}</div>
                  )}
                </div>
                {isNGO && food.status === 'available' && (
                  <div className="food-card-footer">
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setRequestTarget(food)}
                    >
                      📬 Request This Food
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={(p) => setFilters({ ...filters, page: p })} />
        </>
      )}

      {requestTarget && (
        <RequestModal
          food={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};

export default FoodListings;
