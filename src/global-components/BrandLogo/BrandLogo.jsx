import './BrandLogo.css';

const BrandLogo = ({
  size = 'md',
  variant = 'default',
  showName = true,
  className = '',
}) => (
  <div
    className={`brand-logo brand-logo--${size} brand-logo--${variant} ${className}`.trim()}
    role="img"
    aria-label="LDS Production Managament System"
  >
    <img src="/images/ldslogo.png" alt="LDS" />
  </div>
);

export default BrandLogo;
