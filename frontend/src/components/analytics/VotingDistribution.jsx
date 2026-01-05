import React from 'react';
import { motion } from 'framer-motion';

/**
 * VotingDistribution Component
 * Display bar chart of vote distribution
 */
const VotingDistribution = ({ distribution }) => {
  if (!distribution || Object.keys(distribution).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No voting data available
      </div>
    );
  }

  // Convert distribution object to array and sort
  const distributionArray = Object.entries(distribution)
    .map(([estimate, count]) => ({
      estimate,
      count,
    }))
    .sort((a, b) => {
      // Handle special values (?, ☕)
      if (a.estimate === '?') return 1;
      if (b.estimate === '?') return -1;
      if (a.estimate === '☕') return 1;
      if (b.estimate === '☕') return -1;
      
      // Sort numbers numerically
      return parseFloat(a.estimate) - parseFloat(b.estimate);
    });

  const maxCount = Math.max(...distributionArray.map(d => d.count));

  return (
    <div className="space-y-4">
      {distributionArray.map((item, index) => {
        const percentage = (item.count / maxCount) * 100;
        
        return (
          <div key={item.estimate} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {item.estimate}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {item.count} vote{item.count !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-end pr-3"
              >
                {percentage > 20 && (
                  <span className="text-white font-semibold text-sm">
                    {item.count}
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Total Votes
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {distributionArray.reduce((sum, item) => sum + item.count, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VotingDistribution;
