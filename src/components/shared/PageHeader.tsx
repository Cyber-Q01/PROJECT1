
import type { FC, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string | ReactNode;
}

const PageHeader: FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="bg-secondary py-10 md:py-16">
      <div className="container mx-auto text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 tracking-tight">{title}</h1>
        {description && <p className="text-lg md:text-xl text-secondary-foreground/80 max-w-3xl mx-auto">{description}</p>}
      </div>
    </div>
  );
};

export default PageHeader;
