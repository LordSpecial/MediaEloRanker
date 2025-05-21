import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface CategoryTabProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const CategoryTab: React.FC<CategoryTabProps> = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}) => (
  <Card
    className={`cursor-pointer transition-colors ${
      active ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
    }`}
    onClick={onClick}
  >
    <CardContent className="flex items-center justify-center p-6">
      <Icon className={`mr-2 h-5 w-5 ${active ? 'text-white' : 'text-blue-400'}`} />
      <span className={active ? 'text-white' : 'text-gray-300'}>{label}</span>
    </CardContent>
  </Card>
);

export interface CategoryTabsProps {
  tabs: {
    icon: LucideIcon;
    label: string;
    value: string;
  }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(tabs.length, 4)} gap-4 mb-8 ${className}`}>
      {tabs.map(({ icon, label, value }) => (
        <CategoryTab
          key={value}
          icon={icon}
          label={label}
          active={activeTab === value}
          onClick={() => onTabChange(value)}
        />
      ))}
    </div>
  );
}; 