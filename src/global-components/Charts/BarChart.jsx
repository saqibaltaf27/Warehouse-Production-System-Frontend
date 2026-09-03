import React, { useState } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LabelList
} from 'recharts';
import './BarChart.css';

const DEFAULT_BAR_COLOR = 'var(--primary-blue, #1B47DB)';

const CustomBarTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '', formatValue }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-bar-tooltip">
        <div className="custom-bar-tooltip-header">
          <span className="custom-bar-tooltip-title">{label || payload[0]?.payload?.name}</span>
        </div>
        <div className="custom-bar-tooltip-body">
          {payload.map((entry, index) => {
            const val = entry.value;
            const formatted = formatValue
              ? formatValue(val)
              : `${valuePrefix}${typeof val === 'number' ? val.toLocaleString() : val}${valueSuffix}`;
            return (
              <div key={`tip-${index}`} className="custom-bar-tooltip-row">
                <span 
                  className="custom-bar-tooltip-dot" 
                  style={undefined}
                />
                <span className="custom-bar-tooltip-name">{entry.name || 'Value'}:</span>
                <span className="custom-bar-tooltip-value">{formatted}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

// Floating value label rendered above each bar
const renderCustomBarLabel = (props, formatValue, valuePrefix, valueSuffix) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === null || value === 0) return null;

  const displayVal = formatValue
    ? formatValue(value)
    : typeof value === 'number'
      ? value >= 1000
        ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
        : Number.isInteger(value) ? value : value.toFixed(1)
      : value;

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="var(--text-primary, #232E32)"
      textAnchor="middle"
      className="bar-floating-label"
    >
      {`${valuePrefix}${displayVal}${valueSuffix}`}
    </text>
  );
};

const BarChart = ({
  data = [],
  dataKey = 'value',
  xAxisKey = 'name',
  series, // Array for multiple bars: [{ key: 'value1', name: 'Name', color: '#fff' }]
  layout = 'horizontal',
  showLegend = false,
  showValues = true,
  title,
  subtitle,
  periods, // e.g. ['Day', 'Week', 'Month']
  activePeriod,
  onPeriodChange,
  barColor = DEFAULT_BAR_COLOR,
  barRadius = 8,
  barSize = 34,
  maxBarSize = 44,
  valuePrefix = '',
  valueSuffix = '',
  formatValue = null,
  height = '100%',
  className = '',
  secondaryYAxis = false,
  yAxisWidth = 80,
  xAxisInterval = 'preserveEnd',
  xAxisAngle = 0,
  bottomMargin = null,
  chartMargin = null
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className={`bar-chart-container bar-chart-empty ${className}`}>
        <span className="bar-chart-empty-text">No data available</span>
      </div>
    );
  }

  // Determine if floating value labels should be shown (default enabled for <= 14 items in horizontal layout)
  const shouldShowLabels = showValues && layout === 'horizontal' && data.length <= 14;

  return (
    <div className={`bar-chart-container ${className}`}>
      {/* Optional Header with Title and Period Filter */}
      {(title || periods) && (
        <div className="bar-chart-header">
          <div className="bar-chart-title-group">
            {title && <h4 className="bar-chart-title">{title}</h4>}
            {subtitle && <span className="bar-chart-subtitle">{subtitle}</span>}
          </div>

          {periods && periods.length > 0 && (
            <div className="bar-chart-period-tabs">
              {periods.map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`bar-period-pill ${activePeriod === period ? 'active' : ''}`}
                  onClick={() => onPeriodChange && onPeriodChange(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Chart Area */}
      <div className="bar-chart-inner">
        <ResponsiveContainer width="100%" height={height || 260}>
          <RechartsBarChart
            data={data}
            layout={layout}
            margin={
              chartMargin || (layout === 'vertical'
                ? { top: 12, right: 28, left: 10, bottom: 8 }
                : { top: shouldShowLabels ? 24 : 14, right: 16, left: 0, bottom: bottomMargin || 12 })
            }
            barCategoryGap="22%"
          >
            <CartesianGrid
              className="chart-grid"
              strokeDasharray="0"
              vertical={false}
              horizontal
              stroke="var(--border-subtle, rgba(35, 46, 50, 0.08))"
            />

            {layout === 'horizontal' ? (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary, #798089)', fontSize: 11, fontWeight: 500 }}
                  dy={10}
                  interval={xAxisInterval}
                  angle={xAxisAngle}
                  textAnchor={xAxisAngle ? 'end' : 'middle'}
                  height={xAxisAngle ? (bottomMargin ? bottomMargin + 20 : 60) : 30}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary, #798089)', fontSize: 11, fontWeight: 400 }}
                  tickFormatter={(v) =>
                    typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                  width={38}
                />
                {secondaryYAxis && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #798089)', fontSize: 11, fontWeight: 400 }}
                    tickFormatter={(v) =>
                      typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                    width={38}
                  />
                )}
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary, #798089)', fontSize: 11 }}
                  tickFormatter={(v) =>
                    typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary, #798089)', fontSize: 11 }}
                  width={yAxisWidth}
                />
              </>
            )}

            <Tooltip
              cursor={{ fill: 'rgba(27, 71, 219, 0.04)', radius: 6 }}
              content={
                <CustomBarTooltip
                  valuePrefix={valuePrefix}
                  valueSuffix={valueSuffix}
                  formatValue={formatValue}
                />
              }
            />

            {showLegend && <Legend wrapperStyle={{ paddingTop: '10px' }} />}

            {series ? (
              series.map((s, idx) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={s.color || barColor}
                  yAxisId={s.yAxisId || (secondaryYAxis ? 'left' : undefined)}
                  radius={layout === 'vertical' ? [0, barRadius, barRadius, 0] : [barRadius, barRadius, 0, 0]}
                  barSize={barSize}
                  maxBarSize={maxBarSize}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {shouldShowLabels && (
                    <LabelList
                      dataKey={s.key}
                      position="top"
                      content={(props) => renderCustomBarLabel(props, formatValue, valuePrefix, valueSuffix)}
                    />
                  )}
                </Bar>
              ))
            ) : (
              <Bar
                dataKey={dataKey}
                fill={barColor}
                radius={layout === 'vertical' ? [0, barRadius, barRadius, 0] : [barRadius, barRadius, 0, 0]}
                barSize={barSize}
                maxBarSize={maxBarSize}
                animationDuration={800}
                animationEasing="ease-out"
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {data.map((entry, index) => {
                  const isHovered = hoveredIndex === index;
                  const cellColor = entry.color || barColor;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={cellColor}
                      className={`bar-chart-cell ${isHovered ? 'bar-cell-active' : ''}`}
                    />
                  );
                })}
                {shouldShowLabels && (
                  <LabelList
                    dataKey={dataKey}
                    position="top"
                    content={(props) => renderCustomBarLabel(props, formatValue, valuePrefix, valueSuffix)}
                  />
                )}
              </Bar>
            )}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChart;