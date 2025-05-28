import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  RiArrowGoBackLine, 
  RiSensorLine, 
  RiBarChartBoxLine, 
  RiRemoteControlLine,
  RiInformationLine,
  RiCloseLine,
  RiTempHotLine,
  RiWaterFlashLine,
  RiLightbulbLine,
  RiUserLocationLine,
  RiCompassDiscoverLine,
  RiMapPinLine
} from 'react-icons/ri';
import { getFreshViewToken } from '../utils/bimfaceTokenApi';

// Don't declare global types here - they're conflicting with existing ones
// We'll use type assertions instead

// Mock sensor data for overlays
const mockSensors = [
  {
    id: 's1',
    name: 'Temp Sensor 1',
    type: 'temperature',
    location: 'Conference Room',
    value: 22.5,
    unit: '°C',
    status: 'online',
  },
  {
    id: 's2',
    name: 'Temp Sensor 2',
    type: 'temperature',
    location: 'Main Office',
    value: 23.1,
    unit: '°C',
    status: 'online',
  },
  {
    id: 's3',
    name: 'Humidity 1',
    type: 'humidity',
    location: 'Server Room',
    value: 35,
    unit: '%',
    status: 'warning',
  },
  {
    id: 's4',
    name: 'Occupancy 1',
    type: 'occupancy',
    location: 'Lobby',
    value: 12,
    unit: 'people',
    status: 'online',
  }
];

const ModelViewerPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<'iot' | 'analytics' | 'controls' | 'info' | null>(null);
  const [sensors, setSensors] = useState(mockSensors);
  const [showNavOverlay, setShowNavOverlay] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const appRef = useRef<any>(null);
  const skyBoxManagerRef = useRef<any>(null);
  const [skyBoxEnabled, setSkyBoxEnabled] = useState<boolean>(true);
  
  // Parse query parameters from URL
  const getParamsFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const fileId = searchParams.get('fileId');
    const viewTokenParam = searchParams.get('viewToken');
    const activeOverlayParam = searchParams.get('activeOverlay') as 'iot' | 'analytics' | 'controls' | 'info' | null;
    const sensorDataParam = searchParams.get('sensorData');
    
    // Parse sensor data if available
    let parsedSensorData = null;
    if (sensorDataParam) {
      try {
        parsedSensorData = JSON.parse(decodeURIComponent(sensorDataParam));
      } catch (e) {
        console.error("Error parsing sensor data from URL:", e);
      }
    }
    
    return {
      fileId: fileId ? parseInt(fileId, 10) : null,
      viewToken: viewTokenParam,
      activeOverlay: activeOverlayParam,
      sensorData: parsedSensorData
    };
  };

  // Clean up function to remove the viewer
  const cleanupViewer = () => {
    try {
      if (skyBoxManagerRef.current) {
        // Clean up SkyBox if it exists
        skyBoxManagerRef.current = null;
      }
      
      if (appRef.current) {
        console.log("Cleaning up previous viewer instance");
        appRef.current = null;
      }
      if (viewerRef.current) {
        viewerRef.current = null;
      }
      
      // Remove any BIMFACE scripts that might have been added
      const bimfaceScripts = document.querySelectorAll('script[src*="bimface"]');
      bimfaceScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    } catch (e) {
      console.error("Error during cleanup:", e);
    }
  };

  // Function to get a fresh view token using the MatrixBIM server API
  const fetchViewToken = async (fileId: number): Promise<string> => {
    try {
      console.log(`Getting fresh viewer token for fileId: ${fileId}`);
      
      const tokenResponse = await getFreshViewToken(fileId);
      
      if (tokenResponse.success && tokenResponse.viewToken) {
        console.log('Successfully received fresh view token:', tokenResponse.viewToken);
        return tokenResponse.viewToken;
      } else {
        throw new Error('Failed to get fresh view token: Invalid response');
      }
    } catch (error) {
      console.error('Error getting fresh viewer token:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Set the page title
    document.title = "MatrixTwin 3D Viewer";
    
    // Get parameters from URL
    const { fileId, viewToken: urlViewToken, activeOverlay: urlActiveOverlay, sensorData } = getParamsFromUrl();
    console.log("File ID from URL:", fileId);
    console.log("View Token from URL:", urlViewToken);
    console.log("Active Overlay from URL:", urlActiveOverlay);
    
    // Set active overlay if provided in URL
    if (urlActiveOverlay) {
      setActiveOverlay(urlActiveOverlay);
    }
    
    // Set sensor data if provided
    if (sensorData) {
      setSensors(prevSensors => {
        // If we have a single sensor from URL, add it to the list if it's not already there
        const sensorExists = prevSensors.some(s => s.id === sensorData.id);
        if (!sensorExists) {
          return [...prevSensors, sensorData];
        }
        return prevSensors;
      });
    }
    
    // Clean up any existing viewer before creating a new one
    cleanupViewer();
    
    // If viewToken is directly provided in URL, use it
    if (urlViewToken) {
      console.log("Using viewToken directly from URL:", urlViewToken);
      setViewToken(urlViewToken);
      setLoading(false);
      return;
    }
    
    // Otherwise, check if we have a fileId to fetch a token
    if (!fileId) {
      setError("FileId not found. Please check the URL parameters.");
      setLoading(false);
      return;
    }
    
    // Fetch the fresh view token using the exact API call from curl
    const getToken = async () => {
      try {
        const token = await fetchViewToken(fileId);
        console.log(`Got fresh token for fileId ${fileId}:`, token);
        setViewToken(token);
      } catch (err) {
        console.error("Error fetching view token:", err);
        setError(`Failed to get viewer token: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    getToken();

    // Add a global error handler for the viewer
    const errorHandler = (event: ErrorEvent) => {
      console.log('Global error:', event.error);
      // Don't set error state for all errors as some might be non-critical
      // Only set error if we don't already have one
      if (!error && event.error?.message?.includes('bimface')) {
        setError(`Error: ${event.error?.message || 'Unknown error'}`);
      }
    };
    
    window.addEventListener('error', errorHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      cleanupViewer();
    };
  }, [location.search]);

  useEffect(() => {
    if (!viewToken || !containerRef.current) return;
    
    // Initialize the BIMFACE viewer once we have the viewToken
    const script = document.createElement('script');
    script.src = "https://static.bimface.com/api/BimfaceSDKLoader/BimfaceSDKLoader@latest-release.js";
    script.async = true;
    script.onload = () => {
      initializeViewer(viewToken);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [viewToken]);

  // Function to initialize the SkyBox
  const initializeSkyBox = (viewer: any) => {
    try {
      console.log("🌥️ Initializing SkyBox...");
      
      // Check if the SkyBox plugin is available
      if ((window as any).Glodon?.Bimface?.Plugins?.SkyBox) {
        const Glodon = (window as any).Glodon;
        
        // Create SkyBox configuration
        const skyBoxManagerConfig = new Glodon.Bimface.Plugins.SkyBox.SkyBoxManagerConfig();
        skyBoxManagerConfig.viewer = viewer;
        skyBoxManagerConfig.style = Glodon.Bimface.Plugins.SkyBox.SkyBoxStyle.CloudySky;
        
        // Create SkyBox manager
        const skyBoxManager = new Glodon.Bimface.Plugins.SkyBox.SkyBoxManager(skyBoxManagerConfig);
        skyBoxManagerRef.current = skyBoxManager;
        
        console.log("🌥️ SkyBox initialized successfully");
      } else {
        console.error("SkyBox plugin not available");
      }
    } catch (e) {
      console.error("Error initializing SkyBox:", e);
    }
  };

  const initializeViewer = (token: string) => {
    try {
      console.log("🌐 Initializing BIMFACE Viewer with token:", token);
      
      // Follow the exact example from HTML directly
      const options = new (window as any).BimfaceSDKLoaderConfig();
      options.viewToken = token;
      // Set language to English explicitly
      options.language = "en_GB";  // English version
      // options.language = "sv_SE";  // Swedish version
      
      console.log("📦 Config created with language set to English, starting to load SDK...");
      
      // Clear any loading timeout
      const loadTimeout = setTimeout(() => {
        setError("Loading timed out. Please refresh and try again.");
        setLoading(false);
      }, 60000);
      
      // Use the load function exactly as in the example
      (window as any).BimfaceSDKLoader.load(
        options, 
        function successCallback(viewMetaData: any) {
          clearTimeout(loadTimeout);
          console.log("✅ Model loaded successfully. Metadata:", viewMetaData);
          
          if (viewMetaData.viewType === "3DView") {
            // Get DOM element
            const domShow = document.getElementById('bimfaceContainer');
            if (!domShow) {
              throw new Error("Target DOM element not found");
            }
            console.log("📌 Target DOM element found");
            
            // Setup web app config
            const Glodon = (window as any).Glodon;
            const webAppConfig = new Glodon.Bimface.Application.WebApplication3DConfig();
            webAppConfig.domElement = domShow;
            
            // Set global unit to millimeters
            webAppConfig.globalUnit = Glodon.Bimface.Common.Units.LengthUnits.Millimeter;
            
            // Create WebApplication
            const app = new Glodon.Bimface.Application.WebApplication3D(webAppConfig);
            appRef.current = app;
            
            // Add view
            app.addView(token);
            
            // Get viewer
            const viewer = app.getViewer();
            viewerRef.current = viewer;
            
            // Add event listener for view added
            viewer.addEventListener(Glodon.Bimface.Viewer.Viewer3DEvent.ViewAdded, function() {
              console.log("🎉 View added successfully!");
              
              // Initialize SkyBox after view is added
              if (skyBoxEnabled) {
                initializeSkyBox(viewer);
              }
              
              viewer.render();
              setLoading(false);
            });
          }
        },
        function failureCallback(error: any) {
          clearTimeout(loadTimeout);
          console.error("❌ Failed to load model:", error);
          setError(`Failed to load model: ${error || 'Unknown error'}`);
          setLoading(false);
        }
      );
    } catch (e) {
      console.error("Error initializing viewer:", e);
      setError(`Error initializing BIMFACE viewer: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
  };

  // Toggle SkyBox on/off
  const toggleSkyBox = () => {
    const newState = !skyBoxEnabled;
    setSkyBoxEnabled(newState);
    
    if (viewerRef.current) {
      if (newState) {
        // Enable SkyBox
        if (!skyBoxManagerRef.current) {
          initializeSkyBox(viewerRef.current);
        }
      } else {
        // Disable SkyBox
        if (skyBoxManagerRef.current) {
          skyBoxManagerRef.current = null;
          // Re-render to update the view without skybox
          viewerRef.current.render();
        }
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const navigateTo = (path: string) => {
    if (viewToken) {
      navigate(`${path}?viewToken=${viewToken}`);
    } else {
      navigate(path);
    }
  };

  const toggleOverlay = (overlay: 'iot' | 'analytics' | 'controls' | 'info') => {
    // If this overlay is already active, close it
    if (activeOverlay === overlay) {
      setActiveOverlay(null);
      return;
    }
    
    // Activate the requested overlay
    setActiveOverlay(overlay);
    
    // If we have sensor data and it's the IoT overlay, we might want to highlight that sensor
    if (overlay === 'iot' && viewerRef.current) {
      const { sensorData } = getParamsFromUrl();
      if (sensorData) {
        // Find the sensor in our list
        const sensor = sensors.find(s => s.id === sensorData.id);
        if (sensor) {
          try {
            // This is where you'd add code to highlight this specific sensor in the 3D model
            console.log(`Highlighting sensor ${sensor.id} at ${sensor.location}`);
            
            // Example highlighting code (would depend on your exact implementation)
            if ((window as any).Glodon?.Web?.Graphics?.Color) {
              const Glodon = (window as any).Glodon;
              // Reset any previous highlighting
              viewerRef.current.clearHighlightComponents();
              
              // Highlight a component - in a real implementation, you would map the sensor
              // to an actual component ID in your model
              viewerRef.current.highlightComponentsByObjectData([{
                id: Math.floor(Math.random() * 1000) + 1, // This would be your actual component ID
                color: new Glodon.Web.Graphics.Color(255, 0, 0, 0.8)
              }]);
              
              viewerRef.current.render();
            }
          } catch (e) {
            console.error("Error highlighting sensor:", e);
          }
        }
      }
    }
  };

  // Get status color for sensors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get icon for sensor type
  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <RiTempHotLine className="text-red-400" />;
      case 'humidity': return <RiWaterFlashLine className="text-blue-400" />;
      case 'occupancy': return <RiUserLocationLine className="text-purple-400" />;
      case 'energy': return <RiLightbulbLine className="text-yellow-400" />;
      default: return <RiSensorLine className="text-gray-400" />;
    }
  };

  return (
    <div className="h-screen w-screen bg-dark-900 relative">
      {/* Main Viewer Container */}
      <div className="absolute inset-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 z-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-ai-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading 3D Model...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 z-20">
            <div className="bg-dark-800 p-6 rounded-xl max-w-md text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-white text-xl font-bold mb-2">Error Loading Model</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <button 
                onClick={handleBack}
                className="bg-ai-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
        
        <div 
          ref={containerRef}
          id="bimfaceContainer" 
          className="w-full h-full bg-dark-950"
        ></div>
      </div>

      {/* SkyBox Toggle Button */}
    
      
      {/* Fixed Navigation Overlay - Moved higher up */}
      {showNavOverlay && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-dark-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 px-4 py-3 flex items-center gap-4">
          <div className="flex items-center text-white">
            <RiCompassDiscoverLine className="text-ai-blue mr-2 text-xl" />
            <span className="font-medium">Digital Twin Navigator</span>
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex items-center text-slate-300">
            <RiMapPinLine className="text-yellow-500 mr-1" />
            <span>Building Level 3</span>
          </div>
          <button 
            onClick={() => setShowNavOverlay(false)}
            className="ml-2 text-gray-400 hover:text-white p-1 rounded-full"
          >
            <RiCloseLine className="text-lg" />
          </button>
        </div>
      )}
      
      {/* Back button - Moved to bottom left */}
      <button 
        onClick={handleBack}
        className="absolute bottom-6 left-6 z-30 bg-dark-800/80 hover:bg-dark-700/80 text-white p-3 rounded-full shadow-lg backdrop-blur-sm"
      >
        <RiArrowGoBackLine className="text-xl" />
      </button>
      
      {/* Navigation buttons in circular layout on right side */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
        <button 
          className={`${activeOverlay === 'iot' ? 'bg-ai-blue text-white' : 'bg-dark-800/80 hover:bg-dark-700/80 text-white'} p-4 rounded-full shadow-lg backdrop-blur-sm relative`}
          onClick={() => toggleOverlay('iot')}
          onMouseEnter={() => setShowTooltip('iot')}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <RiSensorLine className="text-xl" />
          {showTooltip === 'iot' && activeOverlay !== 'iot' && (
            <div className="absolute top-1/2 -translate-y-1/2 right-14 bg-dark-800/90 text-white text-sm py-2 px-3 rounded-lg shadow-lg whitespace-nowrap backdrop-blur-sm">
              IoT Sensors
            </div>
          )}
        </button>
        
        <button 
          className={`${activeOverlay === 'analytics' ? 'bg-ai-blue text-white' : 'bg-dark-800/80 hover:bg-dark-700/80 text-white'} p-4 rounded-full shadow-lg backdrop-blur-sm relative`}
          onClick={() => toggleOverlay('analytics')}
          onMouseEnter={() => setShowTooltip('analytics')}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <RiBarChartBoxLine className="text-xl" />
          {showTooltip === 'analytics' && activeOverlay !== 'analytics' && (
            <div className="absolute top-1/2 -translate-y-1/2 right-14 bg-dark-800/90 text-white text-sm py-2 px-3 rounded-lg shadow-lg whitespace-nowrap backdrop-blur-sm">
              Building Analytics
            </div>
          )}
        </button>
        
        <button 
          className={`${activeOverlay === 'controls' ? 'bg-ai-blue text-white' : 'bg-dark-800/80 hover:bg-dark-700/80 text-white'} p-4 rounded-full shadow-lg backdrop-blur-sm relative`}
          onClick={() => toggleOverlay('controls')}
          onMouseEnter={() => setShowTooltip('controls')}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <RiRemoteControlLine className="text-xl" />
          {showTooltip === 'controls' && activeOverlay !== 'controls' && (
            <div className="absolute top-1/2 -translate-y-1/2 right-14 bg-dark-800/90 text-white text-sm py-2 px-3 rounded-lg shadow-lg whitespace-nowrap backdrop-blur-sm">
              Smart Controls
            </div>
          )}
        </button>
        
        <button 
          className={`${activeOverlay === 'info' ? 'bg-ai-blue text-white' : 'bg-dark-800/80 hover:bg-dark-700/80 text-white'} p-4 rounded-full shadow-lg backdrop-blur-sm relative`}
          onClick={() => toggleOverlay('info')}
          onMouseEnter={() => setShowTooltip('info')}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <RiInformationLine className="text-xl" />
          {showTooltip === 'info' && activeOverlay !== 'info' && (
            <div className="absolute top-1/2 -translate-y-1/2 right-14 bg-dark-800/90 text-white text-sm py-2 px-3 rounded-lg shadow-lg whitespace-nowrap backdrop-blur-sm">
              Model Information
            </div>
          )}
        </button>
      </div>
      
      {/* IoT Sensors Overlay */}
      {activeOverlay === 'iot' && (
        <div className="absolute top-4 right-16 z-40">
          <div className="bg-dark-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 p-3 w-96">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white text-md font-semibold flex items-center">
                <RiSensorLine className="mr-2 text-ai-blue" /> IoT Sensors
              </h2>
              <button 
                onClick={() => setActiveOverlay(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {sensors.map(sensor => (
                <div key={sensor.id} className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="p-1.5 rounded-lg bg-slate-700/50 mr-2">
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div>
                        <h3 className="text-white text-sm font-medium">{sensor.name}</h3>
                        <p className="text-slate-400 text-xs">{sensor.location}</p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(sensor.status)}`}></div>
                  </div>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-xl font-bold text-white">{sensor.value}</span>
                    <span className="ml-1 text-xs text-slate-400">{sensor.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Building Analytics Overlay */}
      {activeOverlay === 'analytics' && (
        <div className="absolute top-4 right-16 z-40">
          <div className="bg-dark-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 p-3 w-96">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white text-md font-semibold flex items-center">
                <RiBarChartBoxLine className="mr-2 text-ai-blue" /> Building Analytics
              </h2>
              <button 
                onClick={() => setActiveOverlay(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <h3 className="text-white text-sm font-medium mb-1">Energy Consumption</h3>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-white">142.5 kWh</div>
                  <div className="text-green-400 flex items-center text-xs">
                    <span>-12%</span>
                    <span className="ml-1">↓</span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-1">Compared to yesterday</div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full mt-2">
                  <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-300 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <h3 className="text-white text-sm font-medium mb-1">Occupancy Levels</h3>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-white">24 people</div>
                  <div className="text-yellow-400 flex items-center text-xs">
                    <span>+5%</span>
                    <span className="ml-1">↑</span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-1">Peak at 11:30 AM</div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full mt-2">
                  <div className="h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <h3 className="text-white text-sm font-medium mb-1">HVAC Efficiency</h3>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-white">92%</div>
                  <div className="text-blue-400 flex items-center text-xs">
                    <span>+2%</span>
                    <span className="ml-1">↑</span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-1">System performance</div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full mt-2">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <h3 className="text-white text-sm font-medium mb-1">Lighting Usage</h3>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-white">35.2 kWh</div>
                  <div className="text-red-400 flex items-center text-xs">
                    <span>+8%</span>
                    <span className="ml-1">↑</span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-1">Today's consumption</div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full mt-2">
                  <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-300 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Controls Overlay */}
      {activeOverlay === 'controls' && (
        <div className="absolute top-4 right-16 z-40">
          <div className="bg-dark-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 p-3 w-96">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white text-md font-semibold flex items-center">
                <RiRemoteControlLine className="mr-2 text-ai-blue" /> Smart Controls
              </h2>
              <button 
                onClick={() => setActiveOverlay(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-white text-sm font-medium">HVAC System</h3>
                  <div className="relative inline-flex items-center h-5 rounded-full w-9 bg-indigo-600">
                    <span className="inline-block w-3 h-3 transform bg-white rounded-full translate-x-5"></span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-md font-bold text-white">22.5°C</div>
                  <div className="flex gap-1">
                    <button className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs">-</button>
                    <button className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs">+</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-1 mt-2">
                  <button className="bg-blue-500/20 text-blue-400 py-1 px-2 rounded text-xs border border-blue-500/30">Cool</button>
                  <button className="bg-slate-700 text-slate-300 py-1 px-2 rounded text-xs">Auto</button>
                  <button className="bg-slate-700 text-slate-300 py-1 px-2 rounded text-xs">Heat</button>
                </div>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-white text-sm font-medium">Lighting</h3>
                  <div className="relative inline-flex items-center h-5 rounded-full w-9 bg-indigo-600">
                    <span className="inline-block w-3 h-3 transform bg-white rounded-full translate-x-5"></span>
                  </div>
                </div>
                
                <div className="flex flex-col mt-2">
                  <div className="text-white text-xs mb-1">Brightness: 80%</div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value="80" 
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <button className="bg-yellow-500/20 text-yellow-400 py-1 px-2 rounded text-xs border border-yellow-500/30">Main Office</button>
                  <button className="bg-slate-700 text-slate-300 py-1 px-2 rounded text-xs">Conference</button>
                </div>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-white text-sm font-medium">Security System</h3>
                  <div className="relative inline-flex items-center h-5 rounded-full w-9 bg-indigo-600">
                    <span className="inline-block w-3 h-3 transform bg-white rounded-full translate-x-5"></span>
                  </div>
                </div>
                
                <div className="text-md font-bold text-white mt-1">Armed</div>
                <div className="text-green-400 text-xs">All doors secure</div>
                
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <button className="bg-slate-700 text-slate-300 py-1 px-2 rounded text-xs">Disarm</button>
                  <button className="bg-red-500/20 text-red-400 py-1 px-2 rounded text-xs border border-red-500/30">Emergency</button>
                </div>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-white text-sm font-medium">Blinds & Shades</h3>
                  <div className="relative inline-flex items-center h-5 rounded-full w-9 bg-indigo-600">
                    <span className="inline-block w-3 h-3 transform bg-white rounded-full translate-x-5"></span>
                  </div>
                </div>
                
                <div className="flex flex-col mt-2">
                  <div className="text-white text-xs mb-1">Position: 65%</div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value="65" 
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <button className="bg-slate-700 text-slate-300 py-1 px-2 rounded text-xs">Open</button>
                  <button className="bg-slate-700 text-slate-300 py-1 px-2 rounded text-xs">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Information Overlay */}
      {activeOverlay === 'info' && (
        <div className="absolute top-4 right-16 z-40">
          <div className="bg-dark-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 p-3 w-96">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white text-md font-semibold flex items-center">
                <RiInformationLine className="mr-2 text-ai-blue" /> Model Information
              </h2>
              <button 
                onClick={() => setActiveOverlay(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <h3 className="text-white text-sm font-medium mb-1">Building Details</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Name:</span>
                    <span className="text-white text-xs">Matrix Headquarters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Location:</span>
                    <span className="text-white text-xs">Stockholm, Sweden</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Total Area:</span>
                    <span className="text-white text-xs">12,500 m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Floors:</span>
                    <span className="text-white text-xs">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Year Built:</span>
                    <span className="text-white text-xs">2023</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <h3 className="text-white text-sm font-medium mb-1">Model Details</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Model ID:</span>
                    <span className="text-white text-xs">BIM-2023-0142</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Created By:</span>
                    <span className="text-white text-xs">Matrix Design Team</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Last Updated:</span>
                    <span className="text-white text-xs">May 15, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Software:</span>
                    <span className="text-white text-xs">BIMface Enterprise</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">File Size:</span>
                    <span className="text-white text-xs">458 MB</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                <h3 className="text-white text-sm font-medium mb-1">Current View</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">View Mode:</span>
                    <span className="text-white text-xs">3D Perspective</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Floor Shown:</span>
                    <span className="text-white text-xs">Level 3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Active Systems:</span>
                    <span className="text-white text-xs">HVAC, MEP, Structure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelViewerPage; 