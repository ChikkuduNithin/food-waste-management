import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { foodAPI, requestAPI, adminAPI } from '../services/api';
import { Spinner, Badge, formatDateTime, formatDate } from '../components/Shared';

const StatCard = ({ label, value, icon, color = 'green' }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-card-inner">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon">{icon}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin, isDonor, isNGO } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          const res = await adminAPI.getStats();
          setData({ type: 'admin', stats: res.data.data });
        } else if (isDonor) {
          const [foodsRes, reqRes] = await Promise.all([
            foodAPI.getMy({ limit: 5 }),
            requestAPI.getDonorRequests({ limit: 5 }),
          ]);
          setData({
            type: 'donor',
            foods: foodsRes.data.data.foods,
            foodPagination: foodsRes.data.data.pagination,
            requests: reqRes.data.data.requests,
            reqPagination: reqRes.data.data.pagination,
          });
        } else if (isNGO) {
          const [foodsRes, reqRes] = await Promise.all([
            foodAPI.getAll({ status: 'available', limit: 5 }),
            requestAPI.getNGORequests({ limit: 5 }),
          ]);
          setData({
            type: 'ngo',
            foods: foodsRes.data.data.foods,
            foodPagination: foodsRes.data.data.pagination,
            requests: reqRes.data.data.requests,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, isDonor, isNGO]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user.name.split(' ')[0]}! 👋</h1>
        <p>Here's what's happening on the platform today.</p>
      </div>

      {/* ADMIN DASHBOARD */}
      {isAdmin && data?.stats && (
        <>
          <div className="stat-grid">
            <StatCard label="Total Users" value={data.stats.users.total} icon="👥" color="blue" />
            <StatCard label="Food Donors" value={data.stats.users.donors} icon="🍽️" color="green" />
            <StatCard label="NGOs" value={data.stats.users.ngos} icon="🤝" color="orange" />
            <StatCard label="Total Listings" value={data.stats.foods.total} icon="🍱" color="green" />
            <StatCard label="Available Food" value={data.stats.foods.available} icon="✅" color="green" />
            <StatCard label="Completed" value={data.stats.foods.completed} icon="🎉" color="blue" />
            <StatCard label="Total Requests" value={data.stats.requests.total} icon="📋" color="orange" />
            <StatCard label="Pending" value={data.stats.requests.pending} icon="⏳" color="red" />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>👥 Manage Users</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/foods')}>🍱 View Listings</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/requests')}>📋 View Requests</button>
          </div>
        </>
      )}

      {/* DONOR DASHBOARD */}
      {isDonor && data && (
        <>
          <div className="stat-grid">
            <StatCard label="My Listings" value={data.foodPagination?.total ?? 0} icon="🍱" color="green" />
            <StatCard label="Incoming Requests" value={data.reqPagination?.total ?? 0} icon="📬" color="orange" />
            <StatCard
              label="Pending Requests"
              value={data.requests?.filter((r) => r.status === 'pending').length ?? 0}
              icon="⏳" color="red"
            />
          </div>
          <div className="flex gap-3 mb-6">
            <button className="btn btn-primary" onClick={() => navigate('/add-food')}>➕ Add New Listing</button>
            <button className="btn btn-secondary" onClick={() => navigate('/donor-requests')}>📬 View Requests</button>
          </div>

          {data.requests?.length > 0 && (
            <div className="card mb-4">
              <div className="card-header flex justify-between items-center">
                <div>
                  <div className="card-title">Recent Requests</div>
                  <div className="card-subtitle">Latest NGO requests for your food</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/donor-requests')}>View All</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Food Item</th><th>Requested By</th><th>Status</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.requests.map((r) => (
                      <tr key={r._id}>
                        <td><strong>{r.food?.title}</strong></td>
                        <td>{r.ngo?.name}</td>
                        <td><Badge status={r.status} /></td>
                        <td>{formatDateTime(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.foods?.length > 0 && (
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <div>
                  <div className="card-title">My Recent Listings</div>
                  <div className="card-subtitle">Your latest food donations</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-foods')}>View All</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Title</th><th>Quantity</th><th>Status</th><th>Expires</th></tr>
                  </thead>
                  <tbody>
                    {data.foods.map((f) => (
                      <tr key={f._id}>
                        <td><strong>{f.title}</strong></td>
                        <td>{f.quantity}</td>
                        <td><Badge status={f.status} /></td>
                        <td>{formatDate(f.expiryTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* NGO DASHBOARD */}
      {isNGO && data && (
        <>
          <div className="stat-grid">
            <StatCard label="Available Food" value={data.foodPagination?.total ?? 0} icon="🍱" color="green" />
            <StatCard label="My Requests" value={data.requests?.length ?? 0} icon="📋" color="blue" />
            <StatCard
              label="Accepted"
              value={data.requests?.filter((r) => r.status === 'accepted').length ?? 0}
              icon="✅" color="green"
            />
          </div>
          <div className="flex gap-3 mb-6">
            <button className="btn btn-primary" onClick={() => navigate('/foods')}>🔍 Browse Available Food</button>
            <button className="btn btn-secondary" onClick={() => navigate('/ngo-requests')}>📋 My Requests</button>
          </div>

          {data.foods?.length > 0 && (
            <div className="card mb-4">
              <div className="card-header flex justify-between items-center">
                <div>
                  <div className="card-title">Available Food Nearby</div>
                  <div className="card-subtitle">Recent available listings</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/foods')}>Browse All</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Item</th><th>Quantity</th><th>Category</th><th>Expires</th></tr>
                  </thead>
                  <tbody>
                    {data.foods.map((f) => (
                      <tr key={f._id}>
                        <td><strong>{f.title}</strong><br /><span style={{ fontSize: '11.5px', color: 'var(--gray-500)' }}>{f.donor?.name}</span></td>
                        <td>{f.quantity}</td>
                        <td><span className="tag">{f.category}</span></td>
                        <td>{formatDate(f.expiryTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.requests?.length > 0 && (
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <div>
                  <div className="card-title">My Recent Requests</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ngo-requests')}>View All</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Food Item</th><th>Donor</th><th>Status</th><th>Requested</th></tr>
                  </thead>
                  <tbody>
                    {data.requests.map((r) => (
                      <tr key={r._id}>
                        <td><strong>{r.food?.title}</strong></td>
                        <td>{r.donor?.name}</td>
                        <td><Badge status={r.status} /></td>
                        <td>{formatDateTime(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
