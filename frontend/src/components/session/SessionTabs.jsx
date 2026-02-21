import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faFileLines, faChartBar, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../utils/cn';

const TABS = [
  { id: 'estimate',  label: 'Estimate',  icon: faBullseye  },
  { id: 'stories',   label: 'Stories',   icon: faFileLines },
  { id: 'results',   label: 'Results',   icon: faChartBar  },
  { id: 'analytics', label: 'Analytics', icon: faChartLine },
];

/**
 * Horizontal tab bar — only rendered for moderators.
 */
export default function SessionTabs({ activeTab, onTabChange }) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-6 overflow-x-auto scrollbar-hide -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center space-x-1.5 py-3 sm:py-5 px-2 sm:px-3 border-b-2 font-medium transition-colors whitespace-nowrap flex-shrink-0 text-sm',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
