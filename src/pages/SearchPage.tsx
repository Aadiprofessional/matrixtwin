import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { RiSearchLine, RiFileList3Line, RiShieldCheckLine, RiCalendarCheckLine, RiGroupLine, RiBrushLine } from 'react-icons/ri';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../utils/api';
import { Card } from '../components/ui/Card';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  status: string;
  date: string;
  projectId: string;
}

const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { selectedProject } = useProjects();
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const query = new URLSearchParams(location.search).get('q') || '';

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || !user) return;
      
      setLoading(true);
      try {
        const projectParam = selectedProject?.id ? `&projectId=${selectedProject.id}` : '';
        const userParam = user?.id ? `&userId=${user.id}` : '';
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        const response = await fetch(`${API_BASE_URL}/global-forms/search?query=${encodeURIComponent(query)}${projectParam}${userParam}`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          // Assuming data is an array of results
          if (Array.isArray(data)) {
            setResults(data);
          } else if (data.results && Array.isArray(data.results)) {
            setResults(data.results);
          } else {
            setResults([]);
          }
        }
      } catch (error) {
        console.error('Error searching forms:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, selectedProject, user]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'diary': return <RiCalendarCheckLine />;
      case 'safety': return <RiShieldCheckLine />;
      case 'labour': return <RiGroupLine />;
      case 'cleansing': return <RiBrushLine />;
      default: return <RiFileList3Line />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getLinkPath = (result: SearchResult) => {
    let type = result.type;
    if (type === 'inspection' || type === 'survey') {
      type = 'rfi';
    }
    return `/dashboard/${result.projectId}/${type}?id=${result.id}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
          <RiSearchLine className="mr-3 text-portfolio-orange" />
          {t('search.resultsFor', { defaultValue: `Search Results for "${query}"`, query })}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {loading ? t('common.searching', 'Searching...') : t('search.foundResults', { defaultValue: `Found ${results.length} results`, count: results.length })}
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-portfolio-orange"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <Link key={result.id} to={getLinkPath(result)}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer h-full border border-gray-200 dark:border-gray-700 hover:border-portfolio-orange/50 dark:hover:border-portfolio-orange/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-portfolio-orange/10 text-portfolio-orange">
                      {getIcon(result.type)}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate" title={result.title}>
                      {result.title || `${result.type} Form`}
                    </h3>
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{new Date(result.date).toLocaleDateString()}</span>
                      <span className="uppercase text-xs tracking-wider">{result.type}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <RiSearchLine className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No results found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
