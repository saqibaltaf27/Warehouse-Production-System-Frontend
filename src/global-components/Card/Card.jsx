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

        // Colors
        const themeColor = item.color || '#06588D'; // var(--primary-blue)

        const CardContent = (
          <div className={`dome-card-premium ${item.isDark ? 'is-dark' : ''} ${item.active ? 'is-active' : ''}`} style={{ '--theme-color': themeColor }}>

            <div className="card-top-section">
              {item.icon && (
                <div className="card-icon-wrapper" style={{ color: themeColor, backgroundColor: `color-mix(in srgb, ${themeColor} 12%, transparent)` }}>
                  <item.icon size={20} stroke={2} />
                </div>
              )}
              {hasTrend && (
                <div className={`trend-badge ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? <IconTrendingUp size={14} stroke={2.5} /> : <IconTrendingDown size={14} stroke={2.5} />}
                  <span>{Math.abs(item.trend)}%</span>
                </div>
              )}
            </div>

            <div className="card-middle-section">
              <div className="card-title-wrap">
                <span className="card-title-text">{item.title}</span>
                {item.link && (
                  <div className="card-link-arrow">
                    <IconArrowRight size={16} />
                  </div>
                )}
              </div>

              {(item.description || item.trendText) && (
                <div className="card-desc-text">{item.description || item.trendText}</div>
              )}
            </div>

            {(item.stats || item.value !== undefined) && (
              <div className="card-bottom-stats">
                {item.stats ? (
                  item.stats.map((stat, i) => (
                    <div className="stat-block" key={i}>
                      <div className="stat-label">{stat.label}</div>
                      <div className="stat-value" style={{ color: stat.color || '#1e293b' }}>{stat.value}</div>
                    </div>
                  ))
                ) : (
                  <div className="stat-block">
                    <div className="stat-label">{item.valueLabel || 'Total Count'}</div>
                    <div className="stat-value" style={{ color: item.valueColor || '#1e293b' }}>{item.value}</div>
                  </div>
                )}
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
