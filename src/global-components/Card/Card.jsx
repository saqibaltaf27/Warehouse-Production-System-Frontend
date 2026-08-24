import React from 'react';
import { IconTrendingUp, IconTrendingDown, IconArrowRight } from '@tabler/icons-react';
import './Card.css';

const Card = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="dome-card-grid">
      {items.map((item, index) => {
        const hasTrend = item.trend !== undefined && item.trend !== null;
        const isPositive = hasTrend && item.trend >= 0;
        
        const CardContent = (
          <div className={`dome-card-premium ${item.isDark ? 'is-dark' : ''}`}>
            <div className="card-bg-gradient"></div>
            
            <div className="card-top-section">
              <div className="card-title-wrap">
                {item.icon && (
                  <div className="card-icon-wrapper">
                    <item.icon size={18} stroke={2} />
                  </div>
                )}
                <span className="card-title-text">{item.title}</span>
              </div>
              {item.link && (
                <div className="card-link-arrow">
                  <IconArrowRight size={16} />
                </div>
              )}
            </div>
            
            <div className="card-middle-section">
              <h2 className="card-value-text">{item.value || item.description}</h2>
            </div>
            
            {(hasTrend || item.trendText) && (
              <div className="card-bottom-section">
                {hasTrend && (
                  <div className={`trend-indicator ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <IconTrendingUp size={16} stroke={2.5} /> : <IconTrendingDown size={16} stroke={2.5} />}
                    <span>{Math.abs(item.trend)}%</span>
                  </div>
                )}
                {item.trendText && <span className="trend-context">{item.trendText}</span>}
              </div>
            )}
          </div>
        );

        if (item.link) {
          return (
            <a key={index} href={item.link} className="dome-card-link-wrapper">
              {CardContent}
            </a>
          );
        }

        return <div key={index} className="dome-card-wrapper">{CardContent}</div>;
      })}
    </div>
  );
};

export default Card;
