// src/components/dashboard/StatCard.jsx

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// Variants for the icon container styling (color, background)
const iconContainerVariants = cva('p-4 rounded-full flex items-center justify-center hidden md:hidden lg:flex', {
  variants: {
    variant: {
      default: 'bg-primary/10 text-primary',
      success: 'bg-[#9bcf38]/80 text-white dark:bg-green-900/50',
      warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50',
      danger: 'bg-red-100 text-red-600 dark:bg-red-900/50',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const StatCard = ({
  title,
  value,
  icon,
  link,
  variant = 'default',
  subtitle,
}) => {
  return (
    <Link to={link} aria-label={`View details for ${title}`}>
      <Card className="h-[120px] sm:h-[140px] p-4 sm:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        <div className="flex flex-row items-center gap-5 h-full">
          <div className={cn(iconContainerVariants({ variant }))}>
            {icon}

          </div>
          <div className="flex flex-col justify-center h-full gap-1 sm:gap-2 min-w-0">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-regular leading-snug break-words">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-medium text-regular leading-tight break-words">
              {value}
            </p>
            {subtitle ? (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  link: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'danger']),
};

export default StatCard;