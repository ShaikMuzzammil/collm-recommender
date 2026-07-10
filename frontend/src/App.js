import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  Brain, Zap, TrendingUp, Users, BookOpen, Activity, 
  ArrowRight, CheckCircle, AlertCircle, Loader, Database,
  Layers, GitBranch, Cpu, Globe, Shield, Sparkles,
  ChevronRight, Star, Clock, BarChart3, Network, Filter
} from 'lucide-react';
import './App.css';

// Color palette
const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#3b82f6',
  dark: '#1e293b',
  light: '#f8fafc',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#84cc16'];

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Custom Hook for API calls
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { fetchData, loading, error };
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

// Particle Background Component
const ParticleBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas id="particle-canvas" style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

// Navigation Component
const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'recommend', label: 'Recommendations', icon: Sparkles },
    { id: 'model', label: 'Model Architecture', icon: Brain },
    { id: 'training', label: 'Training Pipeline', icon: GitBranch },
    { id: 'analysis', label: 'Performance Analysis', icon: BarChart3 },
    { id: 'datasets', label: 'Datasets', icon: Database },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Brain size={32} />
          <span>CoLLM</span>
        </div>
        <p className="tagline">Collaborative LLM Recommender</p>
      </div>
      <div className="nav-items">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
            {activeTab === tab.id && <ChevronRight size={16} className="indicator" />}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="status-badge">
          <div className="status-dot online"></div>
          <span>System Online</span>
        </div>
        <p className="version">v1.0.0</p>
      </div>
    </nav>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { fetchData, loading } = useApi();
  const [stats, setStats] = useState({
    users: 1000,
    items: 5000,
    interactions: 50000,
    avgLatency: 45,
    accuracy: 0.8245,
    coldStartImprovement: 0.15
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Simulate fetching stats
    const mockActivity = [
      { id: 1, user: 'User_42', action: 'Got recommendations', items: 5, time: '2s ago', confidence: 0.92 },
      { id: 2, user: 'User_128', action: 'Interacted with item', item: 'Sci-Fi Movie 2042', time: '5s ago' },
      { id: 3, user: 'User_7', action: 'Got recommendations', items: 10, time: '12s ago', confidence: 0.88 },
      { id: 4, user: 'User_256', action: 'New user registered', time: '18s ago' },
      { id: 5, user: 'User_512', action: 'Got recommendations', items: 5, time: '25s ago', confidence: 0.95 },
    ];
    setRecentActivity(mockActivity);
  }, []);

  const performanceData = [
    { name: 'MF', warmAUC: 0.6482, coldAUC: 0.7134, overall: 0.6808 },
    { name: 'LightGCN', warmAUC: 0.5959, coldAUC: 0.7103, overall: 0.6531 },
    { name: 'SASRec', warmAUC: 0.7078, coldAUC: 0.6887, overall: 0.6983 },
    { name: 'DIN', warmAUC: 0.7166, coldAUC: 0.8163, overall: 0.7665 },
    { name: 'TALLRec', warmAUC: 0.7097, coldAUC: 0.7375, overall: 0.7236 },
    { name: 'CoLLM', warmAUC: 0.7353, coldAUC: 0.8245, overall: 0.7799 },
  ];

  const radarData = [
    { metric: 'Warm AUC', MF: 0.65, TALLRec: 0.71, CoLLM: 0.74, fullMark: 1.0 },
    { metric: 'Cold AUC', MF: 0.71, TALLRec: 0.74, CoLLM: 0.82, fullMark: 1.0 },
    { metric: 'UAUC', MF: 0.64, TALLRec: 0.68, CoLLM: 0.70, fullMark: 1.0 },
    { metric: 'NDCG', MF: 0.84, TALLRec: 0.87, CoLLM: 0.88, fullMark: 1.0 },
    { metric: 'Efficiency', MF: 0.95, TALLRec: 0.60, CoLLM: 0.85, fullMark: 1.0 },
    { metric: 'Cold Start', MF: 0.30, TALLRec: 0.90, CoLLM: 0.88, fullMark: 1.0 },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1><Activity size={28} /> Dashboard</h1>
        <p>Real-time overview of CoLLM recommendation system</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card gradient">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-content">
            <h3><AnimatedCounter end={stats.users} /></h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: COLORS.secondary + '20', color: COLORS.secondary}}>
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3><AnimatedCounter end={stats.items} /></h3>
            <p>Catalog Items</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: COLORS.accent + '20', color: COLORS.accent}}>
            <Database size={24} />
          </div>
          <div className="stat-content">
            <h3><AnimatedCounter end={stats.interactions} /></h3>
            <p>Interactions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: COLORS.success + '20', color: COLORS.success}}>
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.avgLatency}ms</h3>
            <p>Avg Latency</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: COLORS.info + '20', color: COLORS.info}}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{(stats.accuracy * 100).toFixed(2)}%</h3>
            <p>AUC Score</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: COLORS.warning + '20', color: COLORS.warning}}>
            <Sparkles size={24} />
          </div>
          <div className="stat-content">
            <h3>+{(stats.coldStartImprovement * 100).toFixed(0)}%</h3>
            <p>Cold Start Improvement</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <h3><BarChart3 size={20} /> Model Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0.5, 0.85]} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value) => value.toFixed(4)}
              />
              <Legend />
              <Bar dataKey="warmAUC" fill={COLORS.primary} name="Warm AUC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="coldAUC" fill={COLORS.secondary} name="Cold AUC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overall" fill={COLORS.accent} name="Overall" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><Network size={20} /> Capability Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
              <Radar name="MF" dataKey="MF" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.1} />
              <Radar name="TALLRec" dataKey="TALLRec" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.1} />
              <Radar name="CoLLM" dataKey="CoLLM" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h3><Clock size={20} /> Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.action.includes('recommend') ? <Sparkles size={16} /> : 
                 activity.action.includes('Interacted') ? <CheckCircle size={16} /> : <Users size={16} />}
              </div>
              <div className="activity-content">
                <p><strong>{activity.user}</strong> {activity.action}</p>
                {activity.item && <span className="activity-detail">{activity.item}</span>}
                {activity.confidence && (
                  <span className="confidence-badge">{Math.round(activity.confidence * 100)}% confidence</span>
                )}
              </div>
              <span className="activity-time">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Recommendation Interface
const RecommendationInterface = () => {
  const { fetchData, loading, error } = useApi();
  const [userId, setUserId] = useState('42');
  const [numRecs, setNumRecs] = useState(5);
  const [recommendations, setRecommendations] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [showExplanation, setShowExplanation] = useState(true);

  const getRecommendations = async () => {
    try {
      const data = await fetchData(`/recommend/${userId}?num=${numRecs}`);
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to get recommendations:', err);
    }
  };

  const getUserHistory = async () => {
    try {
      const data = await fetchData(`/users/${userId}/history`);
      setUserHistory(data.history || []);
    } catch (err) {
      console.error('Failed to get history:', err);
    }
  };

  useEffect(() => {
    getUserHistory();
  }, [userId]);

  return (
    <div className="recommendation-page">
      <div className="page-header">
        <h1><Sparkles size={28} /> Smart Recommendations</h1>
        <p>Get personalized recommendations powered by CoLLM</p>
      </div>

      <div className="recommendation-layout">
        <div className="control-panel">
          <div className="input-group">
            <label>User ID</label>
            <input 
              type="number" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              min="0"
              max="999"
            />
          </div>

          <div className="input-group">
            <label>Number of Recommendations</label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={numRecs}
              onChange={(e) => setNumRecs(parseInt(e.target.value))}
            />
            <span className="range-value">{numRecs}</span>
          </div>

          <div className="input-group checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={showExplanation}
                onChange={(e) => setShowExplanation(e.target.checked)}
              />
              Show AI Explanations
            </label>
          </div>

          <button 
            className="generate-btn"
            onClick={getRecommendations}
            disabled={loading}
          >
            {loading ? <Loader size={20} className="spin" /> : <Sparkles size={20} />}
            {loading ? 'Generating...' : 'Get Recommendations'}
          </button>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="results-panel">
          {recommendations && (
            <>
              <div className="results-header">
                <h3>Recommendations for User {recommendations.user_id}</h3>
                <span className="latency-badge">
                  <Zap size={14} />
                  {recommendations.latency_ms}ms
                </span>
              </div>

              <div className="recommendations-list">
                {recommendations.recommendations.map((rec, index) => (
                  <div key={rec.item_id} className="recommendation-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="rec-rank">#{index + 1}</div>
                    <div className="rec-content">
                      <h4>{rec.title}</h4>
                      <div className="rec-meta">
                        <span className="genre-tag">{rec.genre}</span>
                        <span className="item-id">ID: {rec.item_id}</span>
                      </div>
                      {showExplanation && (
                        <div className="explanation">
                          <Brain size={14} />
                          <p>Recommended based on collaborative filtering patterns and semantic analysis of your preferences</p>
                        </div>
                      )}
                    </div>
                    <div className="rec-confidence">
                      <div className="confidence-ring" style={{ '--confidence': `${rec.confidence * 100}%` }}>
                        <span>{(rec.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!recommendations && !loading && (
            <div className="empty-state">
              <Sparkles size={48} />
              <p>Enter a User ID and click "Get Recommendations" to see AI-powered suggestions</p>
            </div>
          )}
        </div>
      </div>

      {/* User History */}
      {userHistory.length > 0 && (
        <div className="history-section">
          <h3><Clock size={20} /> User History ({userHistory.length} items)</h3>
          <div className="history-grid">
            {userHistory.slice(0, 10).map(item => (
              <div key={item.item_id} className="history-item">
                <Star size={14} />
                <span>{item.title}</span>
                <span className="history-genre">{item.genre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Model Architecture Visualization
const ModelArchitecture = () => {
  const architectureSteps = [
    {
      title: 'Input Layer',
      icon: Database,
      description: 'User history items, target item title, UserID, TargetItemID',
      details: ['Text tokens via LLM tokenizer', 'Collaborative embeddings via CIE module'],
      color: COLORS.primary
    },
    {
      title: 'Prompt Construction',
      icon: Layers,
      description: 'Structured prompt template with semantic and collaborative fields',
      details: ['HisItemTitleList', 'UserID placeholder', 'TargetItemTitle', 'TargetItemID placeholder'],
      color: COLORS.secondary
    },
    {
      title: 'Hybrid Encoding',
      icon: GitBranch,
      description: 'Dual encoding: Text via LLM embeddings, Collaborative via CIE mapping',
      details: ['Text Token Embeddings (LLM)', 'User Emb. (CIE)', 'Item Emb. (CIE)'],
      color: COLORS.accent
    },
    {
      title: 'LLM with LoRA',
      icon: Brain,
      description: 'Frozen LLM + Low-Rank Adaptation for recommendation task',
      details: ['Vicuna-7B backbone', 'LoRA rank=8, alpha=16', 'Only LoRA params trainable'],
      color: COLORS.success
    },
    {
      title: 'Prediction Head',
      icon: TrendingUp,
      description: 'Binary classification: Yes/No recommendation decision',
      details: ['Linear projection', 'Sigmoid activation', 'BCE Loss optimization'],
      color: COLORS.info
    }
  ];

  return (
    <div className="architecture-page">
      <div className="page-header">
        <h1><Brain size={28} /> Model Architecture</h1>
        <p>CoLLM: Two-step training with collaborative information encoding</p>
      </div>

      <div className="architecture-flow">
        {architectureSteps.map((step, index) => (
          <div key={index} className="arch-step">
            <div className="arch-card" style={{ borderColor: step.color }}>
              <div className="arch-icon" style={{ background: step.color + '20', color: step.color }}>
                <step.icon size={28} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <ul className="arch-details">
                {step.details.map((detail, i) => (
                  <li key={i}><ChevronRight size={14} /> {detail}</li>
                ))}
              </ul>
            </div>
            {index < architectureSteps.length - 1 && (
              <div className="arch-arrow">
                <ArrowRight size={24} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Two-Step Training Diagram */}
      <div className="training-steps">
        <h3><GitBranch size={20} /> Two-Step Training Strategy</h3>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-badge">Step 1</div>
            <h4>LoRA Fine-tuning</h4>
            <p>Train LoRA module with <strong>text-only prompts</strong></p>
            <ul>
              <li>Exclude collaborative info from prompts</li>
              <li>Learn recommendation task via text semantics</li>
              <li>Ensures cold-start capability</li>
              <li>Frozen LLM + trainable LoRA</li>
            </ul>
            <div className="step-formula">
              <code>θ' = argmin L(h_{Θ+Θ'}(E_t), y)</code>
            </div>
          </div>

          <div className="step-arrow">
            <ArrowRight size={32} />
          </div>

          <div className="step-card">
            <div className="step-badge">Step 2</div>
            <h4>CIE Module Tuning</h4>
            <p>Train CIE with <strong>full prompts</strong> (collaborative + text)</p>
            <ul>
              <li>Include UserID and TargetItemID</li>
              <li>Map collaborative embeddings to LLM space</li>
              <li>Frozen LoRA, trainable CIE</li>
              <li>Seamless integration of both modalities</li>
            </ul>
            <div className="step-formula">
              <code>min_Ω L(h_{Θ+Θ'}(E), y)</code>
            </div>
          </div>
        </div>
      </div>

      {/* CIE Module Detail */}
      <div className="cie-detail">
        <h3><Cpu size={20} /> Collaborative Information Encoding (CIE) Module</h3>
        <div className="cie-visual">
          <div className="cie-box input">
            <h4>Collaborative Model</h4>
            <p>MF / LightGCN / DIN / SASRec</p>
            <span className="dim">d₁ = 128</span>
          </div>
          <div className="cie-arrow">
            <span>MLP Mapping</span>
            <ArrowRight size={20} />
          </div>
          <div className="cie-box output">
            <h4>LLM Token Space</h4>
            <p>Aligned with text embeddings</p>
            <span className="dim">d₂ = 768</span>
          </div>
        </div>
        <div className="cie-layers">
          <div className="layer">Linear(d₁, 512)</div>
          <div className="layer">LayerNorm + ReLU + Dropout</div>
          <div className="layer">Linear(512, 512)</div>
          <div className="layer">LayerNorm + ReLU + Dropout</div>
          <div className="layer">Linear(512, d₂)</div>
          <div className="layer">Projection(d₂, d₂)</div>
        </div>
      </div>
    </div>
  );
};

// Training Pipeline Visualization
const TrainingPipeline = () => {
  const [activePhase, setActivePhase] = useState(0);

  const phases = [
    {
      name: 'Data Preparation',
      status: 'completed',
      metrics: { 'Dataset': 'Amazon-Book', 'Users': '22,967', 'Items': '34,154', 'Interactions': '727,468' },
      description: 'Temporal split: First 11 months for training, remaining for validation/testing'
    },
    {
      name: 'Step 1: LoRA Training',
      status: 'completed',
      metrics: { 'Epochs': '10', 'Loss': '0.2341', 'Val AUC': '0.7097', 'Time': '32min' },
      description: 'Text-only prompt training for cold-start recommendation capability'
    },
    {
      name: 'Step 2: CIE Training',
      status: 'completed',
      metrics: { 'Epochs': '10', 'Loss': '0.1987', 'Val AUC': '0.8245', 'Time': '36min' },
      description: 'Full prompt training with collaborative information integration'
    },
    {
      name: 'Evaluation',
      status: 'completed',
      metrics: { 'Warm AUC': '0.7353', 'Cold AUC': '0.8245', 'UAUC': '0.6923', 'NDCG': '0.8735' },
      description: 'Comprehensive evaluation across warm and cold scenarios'
    }
  ];

  const trainingProgress = [
    { epoch: 1, step1_loss: 0.45, step1_auc: 0.62, step2_loss: 0.42, step2_auc: 0.65 },
    { epoch: 2, step1_loss: 0.38, step1_auc: 0.65, step2_loss: 0.35, step2_auc: 0.70 },
    { epoch: 3, step1_loss: 0.32, step1_auc: 0.67, step2_loss: 0.30, step2_auc: 0.74 },
    { epoch: 4, step1_loss: 0.28, step1_auc: 0.68, step2_loss: 0.26, step2_auc: 0.77 },
    { epoch: 5, step1_loss: 0.25, step1_auc: 0.70, step2_loss: 0.23, step2_auc: 0.79 },
    { epoch: 6, step1_loss: 0.23, step1_auc: 0.71, step2_loss: 0.21, step2_auc: 0.81 },
    { epoch: 7, step1_loss: 0.22, step1_auc: 0.71, step2_loss: 0.20, step2_auc: 0.82 },
    { epoch: 8, step1_loss: 0.21, step1_auc: 0.71, step2_loss: 0.20, step2_auc: 0.82 },
    { epoch: 9, step1_loss: 0.21, step1_auc: 0.71, step2_loss: 0.19, step2_auc: 0.82 },
    { epoch: 10, step1_loss: 0.20, step1_auc: 0.71, step2_loss: 0.19, step2_auc: 0.82 },
  ];

  return (
    <div className="training-page">
      <div className="page-header">
        <h1><GitBranch size={28} /> Training Pipeline</h1>
        <p>Two-step training strategy with progressive capability building</p>
      </div>

      {/* Phase Timeline */}
      <div className="phase-timeline">
        {phases.map((phase, index) => (
          <div 
            key={index} 
            className={`phase-item ${activePhase === index ? 'active' : ''} ${phase.status}`}
            onClick={() => setActivePhase(index)}
          >
            <div className="phase-dot">
              {phase.status === 'completed' ? <CheckCircle size={16} /> : <Loader size={16} />}
            </div>
            <span className="phase-name">{phase.name}</span>
          </div>
        ))}
      </div>

      {/* Phase Details */}
      <div className="phase-details">
        <h3>{phases[activePhase].name}</h3>
        <p>{phases[activePhase].description}</p>
        <div className="metrics-grid">
          {Object.entries(phases[activePhase].metrics).map(([key, value]) => (
            <div key={key} className="metric-item">
              <span className="metric-label">{key}</span>
              <span className="metric-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Training Curves */}
      <div className="training-curves">
        <h3><TrendingUp size={20} /> Training Progress</h3>
        <div className="curves-grid">
          <div className="curve-card">
            <h4>Loss Curves</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trainingProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="epoch" />
                <YAxis domain={[0.15, 0.50]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="step1_loss" stroke={COLORS.primary} name="Step 1: LoRA Loss" strokeWidth={2} />
                <Line type="monotone" dataKey="step2_loss" stroke={COLORS.secondary} name="Step 2: CIE Loss" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="curve-card">
            <h4>AUC Improvement</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trainingProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="epoch" />
                <YAxis domain={[0.60, 0.85]} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="step1_auc" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.1} name="Step 1: LoRA AUC" />
                <Area type="monotone" dataKey="step2_auc" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.1} name="Step 2: CIE AUC" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hyperparameters */}
      <div className="hyperparameters">
        <h3><Filter size={20} /> Hyperparameters</h3>
        <div className="params-grid">
          <div className="param-card">
            <h4>LoRA Configuration</h4>
            <div className="param-row"><span>Rank (r)</span><span>8</span></div>
            <div className="param-row"><span>Alpha</span><span>16</span></div>
            <div className="param-row"><span>Dropout</span><span>0.05</span></div>
            <div className="param-row"><span>Target Modules</span><span>q_proj, v_proj</span></div>
          </div>
          <div className="param-card">
            <h4>Training Settings</h4>
            <div className="param-row"><span>Batch Size</span><span>32</span></div>
            <div className="param-row"><span>Learning Rate</span><span>1e-4</span></div>
            <div className="param-row"><span>Warmup Steps</span><span>100</span></div>
            <div className="param-row"><span>Max Seq Length</span><span>512</span></div>
          </div>
          <div className="param-card">
            <h4>CIE Module</h4>
            <div className="param-row"><span>Hidden Layers</span><span>3</span></div>
            <div className="param-row"><span>Hidden Dim</span><span>512</span></div>
            <div className="param-row"><span>Dropout</span><span>0.1</span></div>
            <div className="param-row"><span>Collaborative Dim</span><span>128</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Analysis
const PerformanceAnalysis = () => {
  const comparisonData = [
    { method: 'MF', ml1m_auc: 0.6482, ml1m_uauc: 0.6361, book_auc: 0.7134, book_uauc: 0.5565 },
    { method: 'LightGCN', ml1m_auc: 0.5959, ml1m_uauc: 0.6499, book_auc: 0.7103, book_uauc: 0.5639 },
    { method: 'SASRec', ml1m_auc: 0.7078, ml1m_uauc: 0.6884, book_auc: 0.6887, book_uauc: 0.5714 },
    { method: 'DIN', ml1m_auc: 0.7166, ml1m_uauc: 0.6459, book_auc: 0.8163, book_uauc: 0.6145 },
    { method: 'TALLRec', ml1m_auc: 0.7097, ml1m_uauc: 0.6818, book_auc: 0.7375, book_uauc: 0.5983 },
    { method: 'CoLLM-MF', ml1m_auc: 0.7295, ml1m_uauc: 0.6875, book_auc: 0.8109, book_uauc: 0.6225 },
    { method: 'CoLLM-DIN', ml1m_auc: 0.7353, ml1m_uauc: 0.6923, book_auc: 0.8245, book_uauc: 0.6474 },
  ];

  const warmColdData = [
    { scenario: 'ML-1M Warm', MF: 0.728, TALLRec: 0.724, CoLLM: 0.753 },
    { scenario: 'ML-1M Cold', MF: 0.552, TALLRec: 0.696, CoLLM: 0.700 },
    { scenario: 'Amazon Warm', MF: 0.768, TALLRec: 0.738, CoLLM: 0.822 },
    { scenario: 'Amazon Cold', MF: 0.522, TALLRec: 0.722, CoLLM: 0.788 },
  ];

  const ablationData = [
    { variant: 'CoLLM-MF', ml1m_auc: 0.7295, ml1m_uauc: 0.6875, book_auc: 0.8133, book_uauc: 0.6314 },
    { variant: 'w/o CIE', ml1m_auc: 0.7097, ml1m_uauc: 0.6818, book_auc: 0.7375, book_uauc: 0.5983 },
    { variant: 'w/ UI-token', ml1m_auc: 0.7214, ml1m_uauc: 0.6563, book_auc: 0.7273, book_uauc: 0.5956 },
  ];

  const tuningData = [
    { method: 'Default', ml1m_auc: 0.7295, ml1m_uauc: 0.6875, book_auc: 0.8109, book_uauc: 0.6225 },
    { method: 'T1 (Ω={φ,ψ})', ml1m_auc: 0.7360, ml1m_uauc: 0.6946, book_auc: 0.8154, book_uauc: 0.6139 },
    { method: 'T2 (from scratch)', ml1m_auc: 0.7418, ml1m_uauc: 0.6906, book_auc: 0.8288, book_uauc: 0.6352 },
    { method: 'T3 (one-step)', ml1m_auc: 0.7131, ml1m_uauc: 0.6661, book_auc: 0.8104, book_uauc: 0.5753 },
  ];

  return (
    <div className="analysis-page">
      <div className="page-header">
        <h1><BarChart3 size={28} /> Performance Analysis</h1>
        <p>Comprehensive evaluation across datasets and scenarios</p>
      </div>

      {/* Overall Comparison */}
      <div className="analysis-section">
        <h3>Overall Performance Comparison</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th colSpan="2">ML-1M</th>
                <th colSpan="2">Amazon-Book</th>
              </tr>
              <tr>
                <th></th>
                <th>AUC</th>
                <th>UAUC</th>
                <th>AUC</th>
                <th>UAUC</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={i} className={row.method.startsWith('CoLLM') ? 'highlight' : ''}>
                  <td><strong>{row.method}</strong></td>
                  <td>{row.ml1m_auc.toFixed(4)}</td>
                  <td>{row.ml1m_uauc.toFixed(4)}</td>
                  <td>{row.book_auc.toFixed(4)}</td>
                  <td>{row.book_uauc.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warm vs Cold */}
      <div className="analysis-section">
        <h3>Warm vs Cold Scenario Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={warmColdData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0.5, 0.85]} />
            <YAxis dataKey="scenario" type="category" width={120} />
            <Tooltip />
            <Legend />
            <Bar dataKey="MF" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            <Bar dataKey="TALLRec" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
            <Bar dataKey="CoLLM" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ablation Study */}
      <div className="analysis-section">
        <h3>Ablation Study: CIE Module Impact</h3>
        <div className="ablation-grid">
          <div className="ablation-chart">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ablationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="variant" tick={{ fontSize: 11 }} />
                <YAxis domain={[0.55, 0.75]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ml1m_auc" fill={COLORS.primary} name="ML-1M AUC" />
                <Bar dataKey="ml1m_uauc" fill={COLORS.secondary} name="ML-1M UAUC" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="ablation-insights">
            <h4>Key Insights</h4>
            <ul>
              <li><strong>CIE Module is crucial:</strong> Removing it (w/o CIE) drops performance to TALLRec level</li>
              <li><strong>UI-token approach fails:</strong> Direct token embeddings hurt compression efficiency</li>
              <li><strong>CoLLM maintains low-rank:</strong> Traditional model preserves collaborative structure</li>
              <li><strong>Best of both worlds:</strong> Semantic + Collaborative integration succeeds</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tuning Strategy */}
      <div className="analysis-section">
        <h3>Tuning Strategy Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tuningData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="method" tick={{ fontSize: 11 }} />
            <YAxis domain={[0.65, 0.75]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ml1m_auc" stroke={COLORS.primary} name="ML-1M AUC" strokeWidth={2} />
            <Line type="monotone" dataKey="ml1m_uauc" stroke={COLORS.secondary} name="ML-1M UAUC" strokeWidth={2} />
            <Line type="monotone" dataKey="book_auc" stroke={COLORS.accent} name="Amazon AUC" strokeWidth={2} />
            <Line type="monotone" dataKey="book_uauc" stroke={COLORS.success} name="Amazon UAUC" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Datasets Page
const DatasetsPage = () => {
  const datasets = [
    {
      name: 'ML-1M',
      description: 'MovieLens 1M - Movie recommendation dataset with ratings',
      stats: { users: 839, items: 3256, train: 33891, valid: 10401, test: 7331 },
      features: ['User IDs', 'Movie IDs', 'Ratings (1-5)', 'Timestamps', 'Movie Titles'],
      split: 'Temporal: First 10 months train, 5 months validation, 5 months test'
    },
    {
      name: 'Amazon-Book',
      description: 'Amazon Product Reviews - Book subset with review scores',
      stats: { users: 22967, items: 34154, train: 727468, valid: 25747, test: 25747 },
      features: ['User IDs', 'Book IDs', 'Review Scores (1-5)', 'Timestamps', 'Book Titles'],
      split: 'Temporal: First 11 months train, remaining for validation/test'
    }
  ];

  const datasetDistribution = [
    { name: 'ML-1M Train', value: 33891, color: COLORS.primary },
    { name: 'ML-1M Valid', value: 10401, color: COLORS.secondary },
    { name: 'ML-1M Test', value: 7331, color: COLORS.accent },
    { name: 'Amazon Train', value: 727468, color: COLORS.success },
    { name: 'Amazon Valid', value: 25747, color: COLORS.info },
    { name: 'Amazon Test', value: 25747, color: COLORS.warning },
  ];

  return (
    <div className="datasets-page">
      <div className="page-header">
        <h1><Database size={28} /> Datasets</h1>
        <p>Evaluation datasets and preprocessing pipeline</p>
      </div>

      <div className="datasets-grid">
        {datasets.map((dataset, index) => (
          <div key={index} className="dataset-card">
            <h3>{dataset.name}</h3>
            <p>{dataset.description}</p>

            <div className="dataset-stats">
              <div className="stat-row">
                <span>Users</span>
                <strong>{dataset.stats.users.toLocaleString()}</strong>
              </div>
              <div className="stat-row">
                <span>Items</span>
                <strong>{dataset.stats.items.toLocaleString()}</strong>
              </div>
              <div className="stat-row">
                <span>Train</span>
                <strong>{dataset.stats.train.toLocaleString()}</strong>
              </div>
              <div className="stat-row">
                <span>Validation</span>
                <strong>{dataset.stats.valid.toLocaleString()}</strong>
              </div>
              <div className="stat-row">
                <span>Test</span>
                <strong>{dataset.stats.test.toLocaleString()}</strong>
              </div>
            </div>

            <div className="dataset-features">
              <h4>Features</h4>
              <div className="feature-tags">
                {dataset.features.map((f, i) => (
                  <span key={i} className="feature-tag">{f}</span>
                ))}
              </div>
            </div>

            <div className="dataset-split">
              <h4>Split Strategy</h4>
              <p>{dataset.split}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Distribution Chart */}
      <div className="distribution-chart">
        <h3>Data Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={datasetDistribution}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {datasetDistribution.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Preprocessing Pipeline */}
      <div className="preprocessing">
        <h3><Filter size={20} /> Preprocessing Pipeline</h3>
        <div className="pipeline-steps">
          <div className="pipeline-step">
            <div className="step-num">1</div>
            <h4>Data Loading</h4>
            <p>Load raw interaction data with timestamps</p>
          </div>
          <ArrowRight size={20} />
          <div className="pipeline-step">
            <div className="step-num">2</div>
            <h4>Temporal Split</h4>
            <p>Split by time to prevent data leakage</p>
          </div>
          <ArrowRight size={20} />
          <div className="pipeline-step">
            <div className="step-num">3</div>
            <h4>Label Conversion</h4>
            <p>Convert ratings to binary labels (threshold: 3 for ML-1M, 4 for Amazon)</p>
          </div>
          <ArrowRight size={20} />
          <div className="pipeline-step">
            <div className="step-num">4</div>
            <h4>Filtering</h4>
            <p>Filter users/items with minimum interactions (≥20 for Amazon-Book)</p>
          </div>
          <ArrowRight size={20} />
          <div className="pipeline-step">
            <div className="step-num">5</div>
            <h4>Prompt Generation</h4>
            <p>Generate text prompts with user history and item metadata</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'recommend': return <RecommendationInterface />;
      case 'model': return <ModelArchitecture />;
      case 'training': return <TrainingPipeline />;
      case 'analysis': return <PerformanceAnalysis />;
      case 'datasets': return <DatasetsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <ParticleBackground />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
