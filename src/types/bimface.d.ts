// Type definitions for BIMFACE SDK

interface Window {
  // BIMFACE SDK Loader
  BimfaceSDKLoader: {
    load: (config: any, successCallback: (viewMetaData: any) => void, failureCallback: (error: any) => void) => void;
  };
  BimfaceSDKLoaderConfig: any;
  BimfaceSDKLoaded: boolean;
  onBimfaceLoaded: () => void;
  
  // BIMFACE Namespace
  Glodon: {
    Bimface: {
      Viewer: {
        Viewer3D: any;
        Viewer3DConfig: any;
        Viewer3DEvent: {
          ViewAdded: string;
          ViewLoaded: string;
          ObjectSelected: string;
        };
        ViewerDrawing: any;
        ViewerDrawingConfig: any;
        ViewerDrawingEvent: {
          Loaded: string;
        };
        ViewerGIS: any;
        ViewerGISConfig: any;
        DisplayStyle: {
          Realistic: string;
          Wireframe: string;
        };
      };
    };
  };
  
  // Viewer instances
  viewer3D: any;
  webApplication: any;
} 