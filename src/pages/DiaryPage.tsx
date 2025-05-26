import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { useAuth } from '../contexts/AuthContext';
import * as RiIcons from 'react-icons/ri';
import { SiteDiaryFormTemplate } from '../components/forms/SiteDiaryFormTemplate';

const DiaryPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Mock diary entries
  const [diaryEntries, setDiaryEntries] = useState([
    {
      id: 1,
      date: '2025-10-20',
      project: 'Project Alpha',
      author: 'John Smith',
      weather: 'Sunny',
      temperature: '72°F',
      workCompleted: 'Completed foundation work on north side. Electrical conduits installed.',
      incidentsReported: 'Minor slip and fall, no injuries.',
      materialsDelivered: 'Concrete: 20 cubic yards, Steel reinforcement: 2 tons',
      notes: 'Subcontractor ABC arrived late. Need to adjust schedule for tomorrow.'
    },
    {
      id: 2,
      date: '2025-10-19',
      project: 'Harbor Tower',
      author: 'Emily Johnson',
      weather: 'Cloudy',
      temperature: '65°F',
      workCompleted: 'Interior framing on floors 3-5. Plumbing rough-in started.',
      incidentsReported: 'None',
      materialsDelivered: 'Lumber: 300 boards, Drywall: 150 sheets',
      notes: 'Team working efficiently, ahead of schedule.'
    },
    {
      id: 3,
      date: '2025-10-18',
      project: 'Metro Station',
      author: 'David Wilson',
      weather: 'Rain',
      temperature: '58°F',
      workCompleted: 'Limited work due to rain. Interior tasks only.',
      incidentsReported: 'None',
      materialsDelivered: 'None',
      notes: 'Weather delays may impact timeline, will reassess tomorrow.'
    },
    {
      id: 4,
      date: '2025-10-17',
      project: 'Project Alpha',
      author: 'John Smith',
      weather: 'Partly Cloudy',
      temperature: '70°F',
      workCompleted: 'Foundation preparation. Site grading completed.',
      incidentsReported: 'None',
      materialsDelivered: 'Gravel: 10 tons, Sand: 5 tons',
      notes: 'Equipment inspection scheduled for tomorrow.'
    }
  ]);
  
  // New diary entry form
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    weather: '',
    temperature: '',
    workCompleted: '',
    incidentsReported: '',
    materialsDelivered: '',
    notes: ''
  });
  
  // Mock projects
  const projects = [
    { id: 1, name: 'Project Alpha' },
    { id: 2, name: 'Harbor Tower' },
    { id: 3, name: 'Metro Station' },
    { id: 4, name: 'Corporate HQ' }
  ];
  
  // Filtered entries based on search
  const filteredEntries = diaryEntries.filter(entry => 
    entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.workCompleted.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.date.includes(searchQuery)
  );
  
  // Handle new entry form changes
  const handleNewEntryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Create new diary entry
  const handleCreateEntry = (formData: any) => {
    const newDiaryEntry = {
      id: Date.now(),
      date: formData.date || new Date().toISOString().split('T')[0],
      project: formData.contractNo || 'Unknown Project',
      author: user?.name || 'Anonymous',
      weather: formData.weatherAM || 'Not specified',
      temperature: '',
      workCompleted: formData.activities?.map((a: any) => a.activity).join(', ') || '',
      incidentsReported: formData.comments || '',
      materialsDelivered: formData.utilities || '',
      notes: formData.remarks || ''
    };
    
    setDiaryEntries([newDiaryEntry, ...diaryEntries]);
    setShowNewEntry(false);
  };
  
  // View entry details
  const handleViewDetails = (entry: any) => {
    setSelectedDiaryEntry(entry);
    setShowDetails(true);
  };
  
  // Get the weather icon based on condition
  const getWeatherIcon = (weather: string) => {
    if (weather.toLowerCase().includes('sun') || weather.toLowerCase().includes('clear')) {
      return <RiIcons.RiSunLine className="text-amber-500" />;
    } else if (weather.toLowerCase().includes('cloud')) {
      return <RiIcons.RiCloudyLine className="text-gray-500" />;
    } else if (weather.toLowerCase().includes('rain')) {
      return <RiIcons.RiRainyLine className="text-blue-500" />;
    } else if (weather.toLowerCase().includes('snow')) {
      return <RiIcons.RiSnowflakeLine className="text-blue-300" />;
    } else {
      return <RiIcons.RiSunCloudyLine className="text-amber-400" />;
    }
  };
  
  // Stats for the header section
  const getStats = () => {
    const totalEntries = diaryEntries.length;
    const thisWeekEntries = diaryEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return entryDate >= startOfWeek;
    }).length;
    
    const uniqueAuthors = new Set(diaryEntries.map(entry => entry.author)).size;
    
    return { totalEntries, thisWeekEntries, uniqueAuthors };
  };
  
  const stats = getStats();
  
  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Enhanced header with gradient background */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 bottom-0 w-1/3 h-1/2">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M30,0 L200,0 L200,200 L0,150 Q10,100 30,0"
              fill="url(#diaryGradient)" 
              className="opacity-30"
              initial={{ x: 200 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="diaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center">
                  <RiIcons.RiBookmarkLine className="mr-3 text-blue-300" />
                  {t('diary.title')}
                </h1>
                <p className="text-blue-200 mt-2 max-w-2xl">
                  Record daily site activities, track progress, and maintain a comprehensive record of your construction project
                </p>
              </motion.div>
            </div>
            
            <motion.div
              className="mt-4 md:mt-0 flex space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button 
                variant="futuristic" 
                leftIcon={<RiIcons.RiAddLine />}
                onClick={() => setShowNewEntry(true)}
                animated
                pulseEffect
                glowing
              >
                New Entry
              </Button>
              <Button 
                variant="futuristic"
                leftIcon={<RiIcons.RiFileTextLine />}
                animated
                glowing
              >
                Generate Report
              </Button>
            </motion.div>
          </div>

          {/* Statistics Section */}
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                <RiIcons.RiBookmarkLine className="text-2xl text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Total Entries</div>
                <div className="text-2xl font-bold text-white">{stats.totalEntries}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                <RiIcons.RiCalendarLine className="text-2xl text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">This Week</div>
                <div className="text-2xl font-bold text-white">{stats.thisWeekEntries}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                <RiIcons.RiUser3Line className="text-2xl text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Contributors</div>
                <div className="text-2xl font-bold text-white">{stats.uniqueAuthors}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <Card className="p-5 border-none shadow-md bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow relative">
              <Input
                type="text"
                placeholder={t('common.search') + " diary entries..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<RiIcons.RiSearchLine className="text-secondary-500" />}
                className="w-full pl-10 pr-4 py-3 text-base"
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  onClick={() => setSearchQuery('')}
                >
                  <RiIcons.RiCloseLine />
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center text-secondary-500 dark:text-secondary-400">
              <RiIcons.RiInformationLine className="mr-2" />
              <span className="text-sm">
                {filteredEntries.length} {filteredEntries.length === 1 ? t('diary.entry') : t('diary.entries')} {t('common.found')}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Diary entries list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <Card 
                className="p-0 overflow-hidden hover:shadow-xl transition-all duration-300 border border-secondary-100 dark:border-dark-700"
              >
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <RiIcons.RiCalendarLine className="text-primary-600 dark:text-primary-400 mr-2" />
                      <span className="font-medium text-primary-900 dark:text-primary-300">{entry.date}</span>
                    </div>
                    <div className="px-3 py-1 bg-white dark:bg-dark-700 rounded-full text-xs font-medium text-secondary-700 dark:text-secondary-300 shadow-sm">
                      {entry.project}
                    </div>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-secondary-900 dark:text-white mb-1">
                    Daily Log by {entry.author}
                  </h3>
                  
                  <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                    {getWeatherIcon(entry.weather)}
                    <span className="ml-1">{entry.weather}, {entry.temperature}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-2">
                      {t('diary.workCompleted')}:
                    </h4>
                    <p className="text-secondary-600 dark:text-secondary-400 line-clamp-2">
                      {entry.workCompleted}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                        {t('diary.incidents')}:
                      </h4>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm line-clamp-1">
                        {entry.incidentsReported || t('common.none')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                        {t('diary.materials')}:
                      </h4>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm line-clamp-1">
                        {entry.materialsDelivered || t('common.none')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(entry)}
                      rightIcon={<RiIcons.RiArrowRightLine />}
                      className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      {t('common.viewDetails')}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {filteredEntries.length === 0 && (
          <Card className="p-8 text-center bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm shadow-md">
            <div className="text-6xl mx-auto mb-4 text-primary-500 opacity-70">
              <RiIcons.RiBookmarkLine />
            </div>
            <h2 className="text-xl font-display font-semibold mb-2">{t('diary.noEntriesFound')}</h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-lg mx-auto">
              {t('diary.tryAdjustingSearch')}
            </p>
            <Button 
              variant="primary" 
              leftIcon={<RiIcons.RiAddLine />}
              onClick={() => setShowNewEntry(true)}
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              {t('diary.createNewEntry')}
            </Button>
          </Card>
        )}
      </motion.div>
      
      {/* New Diary Entry Modal */}
      {showNewEntry && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewEntry(false)}
          >
            <motion.div
              className="w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SiteDiaryFormTemplate
                onClose={() => setShowNewEntry(false)}
                onSave={handleCreateEntry}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}
      
      {/* Entry Details Dialog */}
      <Dialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={t('diary.entryDetails')}
      >
        {selectedDiaryEntry && (
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-primary-900 dark:text-primary-300 flex items-center">
                <RiIcons.RiCalendarCheckLine className="mr-2 text-primary-600 dark:text-primary-400" />
                {selectedDiaryEntry.date}
              </div>
              <div className="px-3 py-1 bg-white dark:bg-dark-700 rounded-full text-sm font-medium text-secondary-700 dark:text-secondary-300 shadow-sm">
                {selectedDiaryEntry.project}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiIcons.RiUserLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">{t('diary.author')}</span>
                </div>
                <div className="font-medium">{selectedDiaryEntry.author}</div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <div className="mr-2 text-primary-600 dark:text-primary-400">
                    {getWeatherIcon(selectedDiaryEntry.weather)}
                  </div>
                  <span className="text-sm font-medium uppercase tracking-wide">{t('diary.weatherConditions')}</span>
                </div>
                <div className="font-medium">{selectedDiaryEntry.weather}, {selectedDiaryEntry.temperature}</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiTaskLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">{t('diary.workCompleted')}</span>
              </div>
              <div className="whitespace-pre-line">{selectedDiaryEntry.workCompleted}</div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiAlertLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">{t('diary.incidentsReported')}</span>
              </div>
              <div>{selectedDiaryEntry.incidentsReported || t('common.none')}</div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiTruckLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">{t('diary.materialsDelivered')}</span>
              </div>
              <div>{selectedDiaryEntry.materialsDelivered || t('common.none')}</div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiFileTextLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">{t('diary.notes')}</span>
              </div>
              <div>{selectedDiaryEntry.notes || t('common.none')}</div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-dark-700">
              <Button 
                variant="outline"
                leftIcon={<RiIcons.RiDownload2Line />}
              >
                {t('common.export')}
              </Button>
              <Button 
                variant="outline"
                leftIcon={<RiIcons.RiPrinterLine />}
              >
                {t('common.print')}
              </Button>
              <Button 
                variant="primary"
                onClick={() => setShowDetails(false)}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default DiaryPage; 