import './Tabs.css';

const Tabs = ({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
  variant = 'pills' // 'pills' or 'underline'
}) => {
  if (!tabs || tabs.length === 0) return null;

  const isUnderline = variant === 'underline';
  const groupClass = isUnderline ? 'global-tab-group-underline' : 'global-tab-group-pills';
  const itemClassBase = isUnderline ? 'global-tab-underline-item' : 'global-tab-pill';

  return (
    <div className={`${groupClass} ${className}`.trim()}>
      {tabs.map((tab) => {
        if (tab.hidden) return null;

        const isActive = activeTab === tab.key;
        const itemClass = `${itemClassBase} ${isActive ? 'active' : ''}`.trim();

        return (
          <button
            key={tab.key}
            className={itemClass}
            onClick={() => onTabChange && onTabChange(tab.key)}
            type="button"
          >
            {tab.icon && (
              <span className="global-tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span className="global-tab-label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
