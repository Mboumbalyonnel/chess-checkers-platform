import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TokenBalance.css';

const TokenBalance = () => {
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchTokens();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/tokens/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTokens(response.data.tokens);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement jetons:', error);
      setLoading(false);
    }
  };

  const claimDailyTokens = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/tokens/daily-refill',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message);
      setTokens(response.data.totalTokens);
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de la réclamation';
      alert(message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return null;

  return (
    <div className="token-balance-container">
      <div className="token-display">
        <span className="token-icon">🪙</span>
        <div className="token-info">
          <div className="token-label">Jetons</div>
          <div className="token-amount">{tokens}</div>
        </div>
      </div>
      <button 
        className="daily-claim-btn"
        onClick={claimDailyTokens}
        disabled={claiming}
      >
        {claiming ? '...' : '🎁 Gratuit'}
      </button>
    </div>
  );
};

export default TokenBalance;