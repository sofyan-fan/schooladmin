// src/components/dashboard/StatCard.jsx

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// Variants for the icon container styling
// Breakpoints: xs:480px, s:560px, sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px, 3xl:1920px
const iconContainerVariants = cva(
  'shrink-0 rounded-full flex items-center justify-center',
  {
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
  }
);

const StatCard = ({
  title,
  value,
  icon,
  link,
  variant = 'default',
}) => {
  return (
    <Link to={link} aria-label={`View details for ${title}`} className="block">
      <Card className="h-full p-2.5 xs:p-3 s:p-3.5 md:p-4 lg:p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        {/* 
          Responsive layout strategy:
          - Mobile (< s/560px): Single column grid, horizontal card layout
          - s+ (560px+): 2-column grid, vertical card layout
          - lg+ (1024px+): 4-column grid, vertical card layout
        */}

        {/* Mobile layout (horizontal single row) - up to s breakpoint */}
        <div className="flex s:hidden items-center gap-1.5 xs:gap-2 h-full">
          <div className={cn(iconContainerVariants({ variant }), 'p-1.5 xs:p-2')}>
            <span className="[&>svg]:size-3.5 xs:[&>svg]:size-4">
              {icon}
            </span>
          </div>
          <p className="text-[11px] xs:text-xs font-medium text-muted-foreground flex-1 min-w-0 leading-tight">
            {title}
          </p>
          <p className="text-base xs:text-lg font-semibold text-regular whitespace-nowrap">
            {value}
          </p>
        </div>

        {/* Tablet & Desktop layout (vertical) - s breakpoint and up */}
        <div className="hidden s:flex flex-col h-full gap-2 md:gap-2.5 lg:gap-3">
          <div className="flex items-center gap-2 md:gap-2.5">
            <div className={cn(iconContainerVariants({ variant }), 'p-2 md:p-2.5 lg:p-3')}>
              <span className="[&>svg]:size-4 md:[&>svg]:size-5 lg:[&>svg]:size-6">
                {icon}
              </span>
            </div>
            <p className="text-sm md:text-base lg:text-lg font-medium text-muted-foreground leading-tight">
              {title}
            </p>
          </div>
          <p className="text-lg s:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-regular leading-none">
            {value}
          </p>
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
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'danger']),
};

export default StatCard;
