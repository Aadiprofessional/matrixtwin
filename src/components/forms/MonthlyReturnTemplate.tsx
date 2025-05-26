import React, { useState } from 'react';
import { RiCalendarLine, RiUserLine, RiFileTextLine, RiDownload2Line, RiAddLine, RiFilePdf2Line, RiCheckLine } from 'react-icons/ri';

interface MonthlyReturnTemplateProps {
  onClose: () => void;
  onSave: (formData: any) => void;
}

// Worker entry interface
interface WorkerEntry {
  id: number;
  trade: string;
  tradeDivision: string;
  org: string;
  code: string;
  days: {[key: number]: string};
  mandays: string;
  duration: string;
  dailyWageRate: {
    average: string;
    high: string;
    low: string;
  }
}

// Form data interface
interface FormData {
  dept: string;
  day: string;
  month: string;
  year: string;
  contractNo: string;
  contractTitle: string;
  contractor: string;
  isNominatedSubcontractor: boolean;
  worksCode: string;
  workers: WorkerEntry[];
}

// Initial worker data
const initialWorkerData: WorkerEntry[] = [
  // Item 1: Bar Bender & Fixer
  { id: 1, trade: 'Bar Bender & Fixer', tradeDivision: 'Bar Bender & Fixer', org: 'C304 / C404', code: 'C304 / C404', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 2: Concreter
  { id: 2, trade: 'Concreter', tradeDivision: 'Concrete and Grouting Worker (Master)', org: '—', code: 'C3016', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 2, trade: 'Concreter', tradeDivision: 'Concreter', org: 'C309 / C409', code: 'C309 / C409', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 2, trade: 'Concreter', tradeDivision: 'Concrete Repairer (Spalling Concrete)', org: '—', code: 'C308', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 2, trade: 'Concreter', tradeDivision: 'Shotcretor', org: '—', code: 'C342', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 2, trade: 'Concreter', tradeDivision: 'Grouting Worker', org: '—', code: 'C321', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 3: Drainlayer
  { id: 3, trade: 'Drainlayer', tradeDivision: 'Drain and Pipe Layer (Master)', org: '—', code: 'C306b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 3, trade: 'Drainlayer', tradeDivision: 'Drainlayer', org: 'C314', code: 'C314 / C414', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 3, trade: 'Drainlayer', tradeDivision: 'Pipelayer', org: '—', code: 'C331', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 4: Plumber
  { id: 4, trade: 'Plumber', tradeDivision: 'Plumber', org: 'C339 / C439', code: 'C339 / C439', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 5: Leveller
  { id: 5, trade: 'Leveller', tradeDivision: 'Leveller', org: 'C323 / C423', code: 'C323 / C423', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 6: Scaffolder
  { id: 6, trade: 'Scaffolder', tradeDivision: 'Scaffolder (Master)', org: 'C303 / C403', code: 'C303 / C403', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 6, trade: 'Scaffolder', tradeDivision: 'Bamboo Scaffolder', org: 'C303 / C403', code: 'C303 / C403', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 6, trade: 'Scaffolder', tradeDivision: 'Metal Scaffolder', org: '—', code: 'C327 / C427', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 7: General Workers
  { id: 7, trade: 'General Workers', tradeDivision: '—', org: '—', code: 'C406', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 8: Carpenter (Formwork)
  { id: 8, trade: 'Carpenter (Formwork)', tradeDivision: 'Carpenter (Fender)', org: '—', code: 'C306', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 8, trade: 'Carpenter (Formwork)', tradeDivision: 'Carpenter (Formwork) (Master)', org: 'C307 / C407', code: 'C307 / C407', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 8, trade: 'Carpenter (Formwork)', tradeDivision: 'Carpenter (Formwork - Civil Construction)', org: '—', code: 'C307a / C407a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 8, trade: 'Carpenter (Formwork)', tradeDivision: 'Carpenter (Formwork - Civil Construction) (Striking)', org: '—', code: 'C307d', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 8, trade: 'Carpenter (Formwork)', tradeDivision: 'Carpenter (Formwork - Building Construction)', org: '—', code: 'C307e / C407e', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 8, trade: 'Carpenter (Formwork)', tradeDivision: 'Carpenter (Formwork - Building Construction) (Striking)', org: '—', code: 'C307n', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 9: Joiner
  { id: 9, trade: 'Joiner', tradeDivision: 'Joiner', org: 'C322 / C422', code: 'C322 / C422', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 9, trade: 'Joiner', tradeDivision: 'Joiner (Assembling)', org: '—', code: 'C322a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 9, trade: 'Joiner', tradeDivision: 'Ground Investigation Operator/Driller/Borer', org: '—', code: 'C320 / C420', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 10: Plant & Equipment Operator (General)
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Fork-lift Truck)', org: '—', code: 'C335f', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Mini-loader)', org: '—', code: 'C335k', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Mini-loader (with Attachments))', org: '—', code: 'C335e', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Grader)', org: '—', code: 'C335g', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Suspended Working Platform)', org: '—', code: 'C335', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Demolition - Excavator)', org: '—', code: 'C336', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Excavator)', org: '—', code: 'C335b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Builder\'s Lift Operator', org: '—', code: 'C332', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Bulldozer)', org: '—', code: 'C335a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Truck-mounted Crane)', org: '—', code: 'C334d', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Dumper)', org: '—', code: 'C335h', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Loader)', org: '—', code: 'C335c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Locomotive)', org: '—', code: 'C333i', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Compactor)', org: '—', code: 'C335j', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 10, trade: 'Plant & Equipment Operator (General)', tradeDivision: 'Plant and Equipment Operator (Scraper)', org: '—', code: 'C335k', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },

  // Item 11: Truck Driver
  { id: 11, trade: 'Truck Driver', tradeDivision: 'Construction Goods Vehicle Driver (Master)', org: 'C349', code: 'C349', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 11, trade: 'Truck Driver', tradeDivision: 'Truck Driver (Medium Goods Vehicles)', org: '—', code: 'C349c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 11, trade: 'Truck Driver', tradeDivision: 'Truck Driver (Heavy Goods Vehicles)', org: '—', code: 'C349a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 11, trade: 'Truck Driver', tradeDivision: 'Truck Driver (Special Purpose Vehicles)', org: '—', code: 'C349b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 11, trade: 'Truck Driver', tradeDivision: 'Truck Driver (Articulated Vehicles)', org: '—', code: 'C349d', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 12: Flooring Worker
  { id: 12, trade: 'Flooring Worker', tradeDivision: 'Floor Layer (Master)', org: '—', code: 'C316 / C416', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 12, trade: 'Flooring Worker', tradeDivision: 'Floor Layer (Timber Flooring)', org: '—', code: 'C316b / C416b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 12, trade: 'Flooring Worker', tradeDivision: 'Floor Layer (PVC Flooring)', org: '—', code: 'C316a / C416a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 12, trade: 'Flooring Worker', tradeDivision: 'Floor Layer (Terrazzo/Mosaic)', org: '—', code: 'C316c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 12, trade: 'Flooring Worker', tradeDivision: 'Plant and Equipment Operator (Percussive Pile)', org: '—', code: 'C335b / C435b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 12, trade: 'Flooring Worker', tradeDivision: 'Plant and Equipment Operator (Bored Pile)', org: '—', code: 'C335a / C435a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 13: Plant & Equipment Operator (Heavy)
  { id: 13, trade: 'Plant & Equipment Operator (Heavy)', tradeDivision: 'Plant and Equipment Operator (Tower Crane)', org: '—', code: 'C334c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 13, trade: 'Plant & Equipment Operator (Heavy)', tradeDivision: 'Plant and Equipment Operator (Crawler-mounted Mobile Crane)', org: '—', code: 'C334a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 13, trade: 'Plant & Equipment Operator (Heavy)', tradeDivision: 'Plant and Equipment Operator (Wheeled-mounted Mobile Crane)', org: '—', code: 'C334b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 13, trade: 'Plant & Equipment Operator (Heavy)', tradeDivision: 'Plant and Equipment Operator (Gantry Crane)', org: '—', code: 'C334b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 13, trade: 'Plant & Equipment Operator (Heavy)', tradeDivision: 'Plant and Equipment Operator (Tunneling) - Jumbo Drilling', org: '—', code: 'C336a / C436a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 13, trade: 'Plant & Equipment Operator (Heavy)', tradeDivision: 'Plant and Equipment Operator (Tunneling) - Segment Erection', org: '—', code: 'C336c / C436c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 13, trade: 'Plant & Equipment Operator (Heavy)', tradeDivision: 'Plant and Equipment Operator (Tunneling) - Tunnel Boring Machine', org: '—', code: 'C336d / C436d', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 14: General Welder
  { id: 14, trade: 'General Welder', tradeDivision: 'General Welder', org: 'C318 / C418', code: 'C318 / C418', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 14, trade: 'General Welder', tradeDivision: 'Metalwork Worker (Master)', org: '—', code: 'C326 / C426', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 15: Metal Worker
  { id: 15, trade: 'Metal Worker', tradeDivision: 'Metal Worker', org: 'C326 / C426', code: 'C326 / C426', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 15, trade: 'Metal Worker', tradeDivision: 'Electronic Equipment Mechanic (Construction Work) (Master)', org: '—', code: 'E303E / E403E', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 16: Equipment and System Mechanic
  { id: 16, trade: 'Equipment and System Mechanic', tradeDivision: 'Building Security System Mechanic', org: '—', code: 'E323 / E423', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 16, trade: 'Equipment and System Mechanic', tradeDivision: 'Communication System Mechanic', org: '—', code: 'E393 / E493', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 16, trade: 'Equipment and System Mechanic', tradeDivision: 'Plant and Equipment Mechanic (Construction Work) (Master)', org: '—', code: 'C326 / C426', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 17: Piling Worker
  { id: 17, trade: 'Piling Worker', tradeDivision: 'Piling Operative (Master)', org: '—', code: 'C335 / C435', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 17, trade: 'Piling Worker', tradeDivision: 'Piling Operative (Percussive Pile)', org: '—', code: 'C335b / C435b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 17, trade: 'Piling Worker', tradeDivision: 'Piling Operative (Bored Pile)', org: '—', code: 'C335a / C435a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 18: Waterproofing Worker
  { id: 18, trade: 'Waterproofing Worker', tradeDivision: 'Waterproofing Worker (Master)', org: '—', code: 'C361', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 18, trade: 'Waterproofing Worker', tradeDivision: 'Waterproofing Worker (Liquid Membrane)', org: '—', code: 'C361c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 18, trade: 'Waterproofing Worker', tradeDivision: 'Waterproofing Worker (Bitumastic Felt)', org: '—', code: 'C361b / C461b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 18, trade: 'Waterproofing Worker', tradeDivision: 'Waterproofing Worker (Adhesive-type Felt)', org: '—', code: 'C361a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 19: Paving Block Layer
  { id: 19, trade: 'Paving Block Layer', tradeDivision: 'Paving Block Layer', org: '—', code: 'C358', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 20: Tiler
  { id: 20, trade: 'Tiler', tradeDivision: 'Tiler', org: '—', code: 'C347 / C447', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 20, trade: 'Tiler', tradeDivision: 'Tiler (Master)', org: '—', code: 'C347a / C447a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 20, trade: 'Tiler', tradeDivision: 'Tiler (Tile)', org: '—', code: 'C347b / C447b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 21: Demolition Worker
  { id: 21, trade: 'Demolition Worker', tradeDivision: 'Demolition Worker (Master)', org: '—', code: 'C312', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 21, trade: 'Demolition Worker', tradeDivision: 'Demolition Worker (Building)', org: '—', code: 'C312a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 21, trade: 'Demolition Worker', tradeDivision: 'Demolition Worker (Unauthorized Building Works)', org: '—', code: 'C312b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 22: Marine Construction Plant Operator
  { id: 22, trade: 'Marine Construction Plant Operator', tradeDivision: 'Marine Construction Plant Operator (Lifting) (Master)', org: '—', code: 'C325c / C425c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 22, trade: 'Marine Construction Plant Operator', tradeDivision: 'Marine Construction Plant Operator (Derrick)', org: '—', code: 'C325c / C425c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 22, trade: 'Marine Construction Plant Operator', tradeDivision: 'Marine Construction Plant Operator (Boom-grab Bucket)', org: '—', code: 'C325e / C425e', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 22, trade: 'Marine Construction Plant Operator', tradeDivision: 'Marine Construction Plant Operator (Boom-hook)', org: '—', code: 'C325b / C425b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 23: Aluminum Window Installer
  { id: 23, trade: 'Aluminum Window Installer', tradeDivision: 'Window Frame Installer', org: '—', code: 'C350 / C450', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 24: Curtain Wall and Glass Installer
  { id: 24, trade: 'Curtain Wall and Glass Installer', tradeDivision: 'Curtain Wall and Glass Panes Installer (Master)', org: '—', code: 'C301 / C401', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 24, trade: 'Curtain Wall and Glass Installer', tradeDivision: 'Glazier', org: 'C319', code: 'C319 / C419', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 24, trade: 'Curtain Wall and Glass Installer', tradeDivision: 'Curtain Wall Installer', org: '—', code: 'C311 / C411', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 25: Painter & Decorator
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Master)', org: 'C329 / C429', code: 'C329 / C429', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Roller Painting)', org: '—', code: 'C329a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Surface Filling)', org: '—', code: 'C329b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Emulsion Painting)', org: '—', code: 'C329c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Brushing Painting)', org: '—', code: 'C329d', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Synthetic Painting)', org: '—', code: 'C329e', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Clear Lacquering)', org: '—', code: 'C329f', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Texture-spray)', org: '—', code: 'C329g', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Metal Paint Spray)', org: '—', code: 'C329h', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Lettering)', org: '—', code: 'C329i', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 25, trade: 'Painter & Decorator', tradeDivision: 'Painter and Decorator (Sign Writing)', org: '—', code: 'C329j', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 26: Plasterer
  { id: 26, trade: 'Plasterer', tradeDivision: 'Cement Sand Mortar Worker (Master)', org: '—', code: 'C308 / C408', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 26, trade: 'Plasterer', tradeDivision: 'Plasterer', org: 'C337 / C437', code: 'C337 / C437', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 26, trade: 'Plasterer', tradeDivision: 'Plasterer (Floor)', org: '—', code: 'C337a / C437a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 27: Tuckpointer
  { id: 27, trade: 'Tuckpointer', tradeDivision: 'Tuckpointer', org: '—', code: 'C348', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 28: False Ceiling Installer
  { id: 28, trade: 'False Ceiling Installer', tradeDivision: 'False Ceiling Installer', org: '—', code: 'C305 / C405', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 29: Gas Installer
  { id: 29, trade: 'Gas Installer', tradeDivision: 'Gas Installer', org: '—', code: 'E375', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 30: Bricklayer
  { id: 30, trade: 'Bricklayer', tradeDivision: 'Bricklayer', org: 'C305 / C405', code: 'C305 / C405', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 31: Structural Steel Welder
  { id: 31, trade: 'Structural Steel Welder', tradeDivision: 'Structural Steel Welder', org: 'C346', code: 'C346', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 32: Rigger/Metal Formwork Erector
  { id: 32, trade: 'Rigger/Metal Formwork Erector', tradeDivision: 'Rigger / Metal Formwork Erector', org: 'C341', code: 'C341 / C441', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 33: Asphalter (Road Construction)
  { id: 33, trade: 'Asphalter (Road Construction)', tradeDivision: 'Asphalter (Road Construction)', org: 'C302', code: 'C302 / C402', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 34: Construction Plant Mechanic
  { id: 34, trade: 'Construction Plant Mechanic', tradeDivision: 'Construction Plant Mechanic', org: 'C310 / C410', code: 'C310 / C410', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 34, trade: 'Construction Plant Mechanic', tradeDivision: 'Control Panel Assembler', org: '—', code: 'E305a / E405a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 35: Electrical Fitter (incl. Electrician)
  { id: 35, trade: 'Electrical Fitter (incl. Electrician)', tradeDivision: 'Electrical Worker', org: '—', code: 'E309 / E409', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 35, trade: 'Electrical Fitter (incl. Electrician)', tradeDivision: 'Electrical Fitter', org: 'E305', code: 'E305', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 36: Mechanical Fitter
  { id: 36, trade: 'Mechanical Fitter', tradeDivision: 'Mechanical Fitter', org: 'E310 / E410', code: 'E310 / E410', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 36, trade: 'Mechanical Fitter', tradeDivision: 'Refrigeration/AC/Ventilation Mechanic (Master)', org: 'E314 / E414', code: 'E314', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 36, trade: 'Mechanical Fitter', tradeDivision: 'Refrigeration/AC/Ventilation Mechanic (Water System)', org: '—', code: 'E314a / E414a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 37: Refrigeration/AC/Ventilation Mechanic
  { id: 37, trade: 'Refrigeration/AC/Ventilation Mechanic', tradeDivision: 'Refrigeration/AC/Ventilation Mechanic (Air System)', org: '—', code: 'E314a / E414a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 37, trade: 'Refrigeration/AC/Ventilation Mechanic', tradeDivision: 'Refrigeration/AC/Ventilation Mechanic (Thermal Insulation)', org: '—', code: 'E314c / E414c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 37, trade: 'Refrigeration/AC/Ventilation Mechanic', tradeDivision: 'Refrigeration/AC/Ventilation Mechanic (Control System)', org: '—', code: 'E314b / E414b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 37, trade: 'Refrigeration/AC/Ventilation Mechanic', tradeDivision: 'Refrigeration/AC/Ventilation Mechanic (Unitary System)', org: '—', code: 'E314d / E414d', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 38: Fire Service Mechanic
  { id: 38, trade: 'Fire Service Mechanic', tradeDivision: 'Fire Service Mechanic (Master)', org: 'E306', code: 'E306', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 38, trade: 'Fire Service Mechanic', tradeDivision: 'Fire Service Portable Equipment Fitter', org: '—', code: 'E306b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 38, trade: 'Fire Service Mechanic', tradeDivision: 'Fire Service Electrical Fitter', org: '—', code: 'E306c / E406c', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 38, trade: 'Fire Service Mechanic', tradeDivision: 'Fire Service Mechanical Fitter', org: '—', code: 'E306a / E406a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 39: Lift and Escalator Mechanic
  { id: 39, trade: 'Lift and Escalator Mechanic', tradeDivision: 'Lift and Escalator Mechanic (Master)', org: 'E309', code: 'E309', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 39, trade: 'Lift and Escalator Mechanic', tradeDivision: 'Lift Mechanic', org: '—', code: 'E309a', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 39, trade: 'Lift and Escalator Mechanic', tradeDivision: 'Escalator Mechanic', org: '—', code: 'E309b', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Item 40: Building Services Maintenance Mechanic
  { id: 40, trade: 'Building Services Maintenance Mechanic', tradeDivision: '—', org: 'E302 / E402', code: '—', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  
  // Items 41-45: Others
  { id: 41, trade: 'Others', tradeDivision: '< trade name >', org: '—', code: 'code', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 42, trade: 'Others', tradeDivision: '< trade name >', org: '—', code: 'code', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 43, trade: 'Others', tradeDivision: '< trade name >', org: '—', code: 'code', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 44, trade: 'Others', tradeDivision: '< trade name >', org: '—', code: 'code', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
  { id: 45, trade: 'Others', tradeDivision: '< trade name >', org: '—', code: 'code', days: {}, mandays: '', duration: '8', dailyWageRate: { average: '', high: '', low: '' } },
];

export const MonthlyReturnTemplate: React.FC<MonthlyReturnTemplateProps> = ({
  onClose,
  onSave
}) => {
  // Add pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  // We have exactly 2 pages: items 1-17 on page 1 and items 18-45 on page 2
  const totalPages = 2;
  
  // Split workers into pages with plenty of capacity
  const workersPerPage = 45;
  
  // Remove pagination state since we only need one page
  const [formData, setFormData] = useState<FormData>({
    dept: '',
    day: '',
    month: '',
    year: '',
    contractNo: '',
    contractTitle: '',
    contractor: '',
    isNominatedSubcontractor: false,
    worksCode: '',
    workers: initialWorkerData
  });
  
  // Get current page workers
  const getCurrentPageWorkers = () => {
    // For page 1, get workers with ID 1-17
    if (currentPage === 1) {
      const page1Workers = formData.workers.filter(worker => worker.id <= 17);
      console.log('Page 1 Workers:', page1Workers.length, page1Workers.map(w => w.id));
      return page1Workers;
    }
    
    // For page 2, get workers with ID 18-45
    if (currentPage === 2) {
      const page2Workers = formData.workers.filter(worker => worker.id >= 18 && worker.id <= 45);
      console.log('Page 2 Workers:', page2Workers.length, page2Workers.map(w => w.id));
      return page2Workers;
    }
    
    // For any other pages that might be added in the future
    const startId = (currentPage - 1) * 17 + 1;
    const endId = Math.min(startId + 16, Math.max(...formData.workers.map(w => w.id)));
    const otherPageWorkers = formData.workers.filter(worker => worker.id >= startId && worker.id <= endId);
    console.log(`Page ${currentPage} Workers:`, otherPageWorkers.length, otherPageWorkers.map(w => w.id));
    return otherPageWorkers;
  };
  
  // Get the current month days (31 days for display)
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);
  
  // Replace pagination handlers with a single changePage function
  const changePage = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  
  // Handlers
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const handleWorkerDataChange = (id: number, field: string, value: string) => {
    setFormData({
      ...formData,
      workers: formData.workers.map(worker => 
        worker.id === id ? { ...worker, [field]: value } : worker
      )
    });
  };
  
  const handleWageRateChange = (id: number, type: 'average' | 'high' | 'low', value: string) => {
    setFormData({
      ...formData,
      workers: formData.workers.map(worker => 
        worker.id === id ? { 
          ...worker, 
          dailyWageRate: { 
            ...worker.dailyWageRate, 
            [type]: value 
          } 
        } : worker
      )
    });
  };
  
  const handleDayDataChange = (workerId: number, day: number, value: string) => {
    setFormData({
      ...formData,
      workers: formData.workers.map(worker => 
        worker.id === workerId ? { 
          ...worker, 
          days: { 
            ...worker.days, 
            [day]: value 
          } 
        } : worker
      )
    });
  };
  
  const handleAddRow = () => {
    // Find highest ID to ensure it's sequential
    const maxId = Math.max(...formData.workers.map(w => w.id));
    const newId = maxId + 1;
    
    setFormData({
      ...formData,
      workers: [
        ...formData.workers,
        { 
          id: newId, 
          trade: '', 
          tradeDivision: '',
          org: '',
          code: '',
          days: {},
          mandays: '',
          duration: '8',
          dailyWageRate: { average: '', high: '', low: '' } 
        }
      ]
    });
  };
  
  const handleSave = () => {
    onSave(formData);
  };
  
  const handleDownloadPDF = () => {
    // Create a new window to render the PDF content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download the PDF');
      return;
    }

    // Write the HTML content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Monthly Return of Site Labour Deployment and Wage Rates for Construction Works</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: black;
              font-size: 10px;
              width: 100%;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid black;
              padding: 2px;
              text-align: center;
              vertical-align: middle;
              height: 16px;
              font-size: 8px;
              overflow: visible;
              white-space: normal;
            }
            th {
              background-color: #f2f2f2;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 9px;
            }
            .header-left {
              text-align: left;
            }
            .header-center {
              text-align: center;
              font-weight: bold;
              font-size: 12px;
              margin-top: 10px;
            }
            .header-right {
              text-align: right;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .info-item {
              display: flex;
              align-items: center;
            }
            .info-label {
              margin-right: 5px;
            }
            .info-value {
              border-bottom: 1px solid black;
              min-width: 80px;
              padding: 0 5px;
            }
            .footer {
              margin-top: 15px;
              display: flex;
              justify-content: space-between;
            }
            .signature-line {
              display: flex;
              margin-bottom: 5px;
            }
            .signature-label {
              margin-right: 5px;
              white-space: nowrap;
            }
            .signature-value {
              border-bottom: 1px solid black;
              flex-grow: 1;
              min-width: 150px;
            }
            .footnote {
              margin-top: 10px;
              text-align: right;
              font-size: 8px;
            }
            .note {
              font-style: italic;
              font-size: 8px;
              text-align: center;
              padding: 1px;
            }
            .special-note {
              font-style: italic;
              font-size: 7px;
              text-align: center;
              padding: 1px;
              line-height: 1.2;
            }
            .trade-cell {
              text-align: left;
              font-size: 7px;
              width: 200px;
              white-space: normal;
              overflow: visible;
            }
            .trade-division-cell {
              text-align: left;
              font-size: 7px;
              width: 200px;
              white-space: normal;
              overflow: visible;
            }
            .calendar-cell {
              width: 15px;
              padding: 1px 0;
            }
            .calendar-header {
              padding: 1px 0;
              width: 15px;
            }
            .item-no {
              width: 25px;
            }
            .rate-code {
              width: 60px;
            }
            .trade-group {
              border-top: 2px solid #888;
            }
            .even-row {
              background-color: #f9f9f9;
            }
            .odd-row {
              background-color: #ffffff;
            }
            .page-break {
              page-break-before: always;
              margin-top: 40px;
            }
            @media print {
              html, body {
                width: 420mm;
                height: 297mm;
                padding: 0;
                margin: 0;
              }
              @page {
                size: A3 landscape;
                margin: 10mm;
                scale: 100%;
              }
              .page-break {
                page-break-before: always;
              }
              table {
                page-break-inside: avoid;
              }
              tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => `
            ${pageNum > 1 ? '<div class="page-break"></div>' : ''}
            ${generatePageHTML(pageNum)}
          `).join('')}
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Helper function to generate page HTML
    function generatePageHTML(pageNum: number) {
      // Filter workers by ID range for each page
      let pageWorkers: WorkerEntry[];
      if (pageNum === 1) {
        pageWorkers = formData.workers.filter(worker => worker.id <= 17);
      } else if (pageNum === 2) {
        pageWorkers = formData.workers.filter(worker => worker.id >= 18 && worker.id <= 45);
      } else {
        const startId = (pageNum - 1) * 17 + 1;
        const endId = startId + 16;
        pageWorkers = formData.workers.filter(worker => worker.id >= startId && worker.id <= endId);
      }
      
      return `
        <div class="page">
          <div class="header">
            <div class="header-left">
              <div>Original - by e-mail to CEDD</div>
              <div>Duplicate - to Project Office</div>
            </div>
            <div class="header-center">
              Monthly Return of Site Labour Deployment and Wage Rates for Construction Works
            </div>
            <div class="header-right">
              <div>Triplicate - filed as Site Record</div>
              <div>Quadruplicate - kept by Contractor</div>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <div class="info-label">Dept/Div:</div>
              <div class="info-value">${formData.dept}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Month/Year:</div>
              <div class="info-value">${formData.month}/${formData.year}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contract No.:</div>
              <div class="info-value">${formData.contractNo}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contract Title:</div>
              <div class="info-value">${formData.contractTitle}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contractor:</div>
              <div class="info-value">${formData.contractor}</div>
            </div>
            <div class="info-item">
              <input type="checkbox" ${formData.isNominatedSubcontractor ? 'checked' : ''} />
              <div class="info-label">Nominated Sub-contractor</div>
              <div class="info-label">(Please tick the box if applicable)</div>
            </div>
            <div class="info-item">
              <div class="info-label">Works Code:</div>
              <div class="info-value">${formData.worksCode}</div>
              <sup>1)</sup>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th rowspan="2" class="item-no">Item No.</th>
                <th rowspan="2" class="trade-cell">Trade</th>
                <th rowspan="2" class="trade-division-cell">Trade Division</th>
                <th colspan="2">Trade List<sup>1)</sup></th>
                <th colspan="31">Number of workers engaged on site on each calendar day<sup>2)</sup></th>
                <th rowspan="2" style="width: 30px;">Total<br/>Man-days</th>
                <th rowspan="2" style="width: 35px;">Overtime<br/>(hours)</th>
                <th colspan="3">Daily Wage Rate ($)<sup>3)</sup></th>
                <th rowspan="2" class="item-no">Item<br/>No.</th>
              </tr>
              <tr>
                <th style="width: 25px;">Org.</th>
                <th class="rate-code">Rate<br/>(Code)</th>
                ${monthDays.map(day => `<th class="calendar-header">${day}</th>`).join('')}
                <th style="width: 30px;">Av.</th>
                <th style="width: 30px;">High</th>
                <th style="width: 30px;">Low</th>
              </tr>
            </thead>
            <tbody>
              ${pageWorkers.map((worker, idx) => {
                // Determine if this is the first row of a trade group
                const isFirstInTradeGroup = idx === 0 || 
                  (idx > 0 && pageWorkers[idx - 1]?.trade !== worker.trade);
                
                // Calculate the actual item number based on the page
                const displayId = worker.id;
                
                // Calculate row class based on trade ID
                const rowClass = worker.id % 2 === 0 ? 'even-row' : 'odd-row';
                
                // Add trade-group class if it's the first row of a trade
                const tradeGroupClass = isFirstInTradeGroup ? 'trade-group' : '';
                  
                return `
                  <tr class="${rowClass} ${tradeGroupClass}">
                    <td style="width: 25px; text-align: center; font-weight: ${isFirstInTradeGroup ? 'bold' : 'normal'};">${isFirstInTradeGroup ? displayId : ''}</td>
                    <td class="trade-cell" style="text-align: left; font-weight: ${isFirstInTradeGroup ? 'bold' : 'normal'};">${isFirstInTradeGroup ? worker.trade : ''}</td>
                    <td class="trade-division-cell" style="text-align: left;">${worker.tradeDivision}</td>
                    <td style="width: 25px; text-align: center;">${worker.org}</td>
                    <td class="rate-code" style="text-align: center;">${worker.code}</td>
                    ${monthDays.map(day => `<td class="calendar-cell">${worker.days[day] || ''}</td>`).join('')}
                    <td style="text-align: center;">${worker.mandays}</td>
                    <td style="text-align: center;">${worker.duration}</td>
                    <td style="text-align: center;">${worker.dailyWageRate.average}</td>
                    <td style="text-align: center;">${worker.dailyWageRate.high}</td>
                    <td style="text-align: center;">${worker.dailyWageRate.low}</td>
                    <td style="width: 25px; text-align: center; font-weight: ${isFirstInTradeGroup ? 'bold' : 'normal'};">${isFirstInTradeGroup ? displayId : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          ${pageNum === 2 ? `
          <div class="footer">
            <div>
              <div class="signature-line">
                <div class="signature-label">Completed by Agent of Contractor</div>
                <div class="signature-label">Name (in block letters) & Signature:</div>
                <div class="signature-value"></div>
              </div>
              <div class="signature-line">
                <div class="signature-label">Checked by IOW/COW</div>
                <div class="signature-label">Name (in block letters) & Signature:</div>
                <div class="signature-value"></div>
              </div>
            </div>
            <div style="margin-left: 30px;">
              <div class="signature-line">
                <div class="signature-label">Tel. No.:</div>
                <div class="signature-value"></div>
              </div>
              <div class="signature-line">
                <div class="signature-label">Tel. No.:</div>
                <div class="signature-value"></div>
              </div>
            </div>
          </div>

          <div class="footnote">
            <div>* Tick in the box only for a nominated sub-contractor</div>
            <div>Please refer to the overleaf for filling this return</div>
            <div style="margin-top: 5px;">G.F. 527 (Rev. 1/2017)</div>
          </div>
          ` : ''}
        </div>
      `;
    }
  };

  return (
    <div className="w-full max-w-[95vw] mx-auto bg-[#1e293b] rounded-xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-[#334155]">
      <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-b border-[#334155]">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <RiFileTextLine className="mr-2 text-blue-400" />
          Monthly Return of Site Labour Deployment
        </h2>
        <div className="flex gap-3 items-center">
          {/* Page number buttons */}
          <div className="flex gap-2">
            {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
              <button
                key={`page-${page}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-[#334155] text-gray-200 hover:bg-[#475569]'}`}
                onClick={() => changePage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-gray-100 rounded-md shadow-md text-sm font-medium transition-all duration-200 hover:scale-105"
          >
            Cancel
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-gray-100 rounded-md shadow-md text-sm font-medium flex items-center gap-1 transition-all duration-200 hover:scale-105"
          >
            <RiFilePdf2Line className="text-blue-400" />
            Download as A3 Landscape PDF
          </button>
          <button
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
            onClick={handleSave}
          >
            Save
            <RiCheckLine className="text-white" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-5 bg-gradient-to-tr from-gray-100 to-gray-50">
        <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md w-full">
          {/* Original header - exactly as in image */}
          <div className="flex justify-between text-xs mb-4">
            <div className="flex flex-col">
              <div>Original - by e-mail to CEDD</div>
              <div>Duplicate - to Project Office</div>
            </div>
            <div className="font-bold text-lg text-center">
              Monthly Return of Site Labour Deployment and Wage Rates for Construction Works
            </div>
            <div className="flex flex-col items-end">
              <div>Triplicate - filed as Site Record</div>
              <div>Quadruplicate - kept by Contractor</div>
            </div>
          </div>
          
          {/* Form header section */}
          <div className="grid grid-cols-3 mb-4 text-sm">
              <div className="flex items-center">
              <label className="font-semibold">Dept/Div:</label>
              <div className="mx-2 border-b border-gray-400 flex-1">
                <input 
                  type="text" 
                  className="w-full border-none outline-none bg-transparent"
                  value={formData.dept}
                  onChange={(e) => handleInputChange('dept', e.target.value)}
                />
              </div>
            </div>
              <div className="flex items-center">
              <label className="font-semibold">Month/Year:</label>
              <div className="mx-2 flex items-center">
                  <input 
                  type="text" 
                  className="w-12 border-none outline-none bg-transparent text-center border-b border-gray-400"
                    value={formData.month}
                    onChange={(e) => handleInputChange('month', e.target.value)}
                  placeholder="MM"
                  />
                <span className="mx-1">/</span>
                  <input 
                  type="text" 
                  className="w-16 border-none outline-none bg-transparent text-center border-b border-gray-400"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="YYYY"
                  />
                </div>
              </div>
              <div className="flex items-center">
              <label className="font-semibold">Contract No.:</label>
              <div className="mx-2 border-b border-gray-400 flex-1">
                <input 
                  type="text" 
                  className="w-full border-none outline-none bg-transparent"
                  value={formData.contractNo}
                  onChange={(e) => handleInputChange('contractNo', e.target.value)}
                />
              </div>
              </div>
            </div>
            
          <div className="grid grid-cols-1 mb-4 text-sm">
              <div className="flex items-center">
              <label className="font-semibold">Contract Title:</label>
              <div className="mx-2 border-b border-gray-400 flex-1">
                <input 
                  type="text" 
                  className="w-full border-none outline-none bg-transparent"
                  value={formData.contractTitle}
                  onChange={(e) => handleInputChange('contractTitle', e.target.value)}
                />
              </div>
              </div>
            </div>
            
          <div className="flex flex-wrap mb-4 text-sm">
            <div className="flex items-center mr-8 flex-1">
              <label className="font-semibold">Contractor:</label>
              <div className="mx-2 border-b border-gray-400 flex-1">
                <input 
                  type="text" 
                  className="w-full border-none outline-none bg-transparent"
                  value={formData.contractor}
                  onChange={(e) => handleInputChange('contractor', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center mr-4">
              <div className="flex items-center border border-gray-300 h-4 w-4 mr-1">
                {formData.isNominatedSubcontractor && (
                  <div className="h-3 w-3 m-px bg-gray-500"></div>
                )}
                  <input
                    type="checkbox"
                  className="opacity-0 absolute"
                    checked={formData.isNominatedSubcontractor}
                    onChange={(e) => handleInputChange('isNominatedSubcontractor', e.target.checked)}
                  />
                </div>
              <label>Nominated Sub-contractor</label>
              <span className="text-xs ml-1">(Please tick the box if applicable)</span>
            </div>

              <div className="flex items-center">
              <label className="font-semibold">Works Code:</label>
              <div className="mx-2 border-b border-gray-400 w-32">
                <input 
                  type="text" 
                  className="w-full border-none outline-none bg-transparent"
                  value={formData.worksCode}
                  onChange={(e) => handleInputChange('worksCode', e.target.value)}
                />
              </div>
              <sup className="ml-1 text-xs">1)</sup>
            </div>
          </div>
          
          {/* Main table div with grid appearance that matches the image */}
          <div className="w-full overflow-x-auto">
            <table className="border-collapse border border-gray-800 text-xs w-full">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-gray-800 p-1 w-10 text-center">Item<br/>No.</th>
                  <th rowSpan={2} className="border border-gray-800 p-1 w-28 text-left">Trade</th>
                  <th rowSpan={2} className="border border-gray-800 p-1 w-44 text-left">Trade Division</th>
                  <th colSpan={2} className="border border-gray-800 p-1 text-center">Trade List<sup>1)</sup></th>
                  <th colSpan={31} className="border border-gray-800 p-1 text-center">Number of workers engaged on site on each calendar day<sup>2)</sup></th>
                  <th rowSpan={2} className="border border-gray-800 p-1 w-16 text-center">Total<br/>Man-days</th>
                  <th rowSpan={2} className="border border-gray-800 p-1 w-16 text-center">Overtime<br/>(hours)</th>
                  <th colSpan={3} className="border border-gray-800 p-1 text-center">Daily Wage Rate ($)<sup>3)</sup></th>
                  <th rowSpan={2} className="border border-gray-800 p-1 w-10 text-center">Item<br/>No.</th>
                </tr>
                <tr>
                  <th className="border border-gray-800 p-1 w-14 text-center">Org.</th>
                  <th className="border border-gray-800 p-1 w-14 text-center">Code</th>
                  {monthDays.map(day => (
                    <th key={day} className="border border-gray-800 p-1 w-5 text-center">{day}</th>
                  ))}
                  <th className="border border-gray-800 p-1 w-12 text-center">Av.</th>
                  <th className="border border-gray-800 p-1 w-12 text-center">High</th>
                  <th className="border border-gray-800 p-1 w-12 text-center">Low</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageWorkers().map((worker, idx) => {
                  // Determine if this is the first row of a trade group
                  const isFirstInTradeGroup = idx === 0 || 
                    (idx > 0 && getCurrentPageWorkers()[idx - 1]?.trade !== worker.trade);
                  
                  // Calculate if this should be a dark or light row based on trade ID (not index)
                  const isDarkRow = worker.id % 2 === 0;
                  
                  return (
                    <tr 
                      key={`worker-${idx}`} 
                      className={`h-7 ${isDarkRow ? 'bg-gray-100' : 'bg-white'} ${isFirstInTradeGroup ? 'border-t-2 border-gray-400' : ''}`}
                    >
                      <td className="border border-gray-800 p-0 text-center">
                        {isFirstInTradeGroup ? <span className="font-bold">{worker.id}</span> : ''}
                      </td>
                      <td className="border border-gray-800 p-0 text-left pl-1">
                        {isFirstInTradeGroup ? <span className="font-bold">{worker.trade}</span> : ''}
                      </td>
                      <td className="border border-gray-800 p-0 text-left pl-1">
                        {worker.tradeDivision}
                      </td>
                      <td className="border border-gray-800 p-0 text-center">
                        {worker.org}
                      </td>
                      <td className="border border-gray-800 p-0 text-center">
                        {worker.code}
                      </td>
                      {monthDays.map(day => (
                        <td key={`day-${worker.id}-${day}`} className="border border-gray-800 p-0 text-center">
                          <input
                            type="text" 
                            className="w-5 h-full border-none outline-none bg-transparent text-center"
                            value={worker.days[day] || ''}
                            onChange={(e) => handleDayDataChange(worker.id, day, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="border border-gray-800 p-0 text-center">
                        <input
                          type="text" 
                          className="w-full h-full border-none outline-none bg-transparent text-center"
                          value={worker.mandays}
                          onChange={(e) => handleWorkerDataChange(worker.id, 'mandays', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-0 text-center">
                        <input
                          type="text" 
                          className="w-full h-full border-none outline-none bg-transparent text-center"
                          value={worker.duration}
                          onChange={(e) => handleWorkerDataChange(worker.id, 'duration', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-0 text-center">
                        <input
                          type="text" 
                          className="w-full h-full border-none outline-none bg-transparent text-center"
                          value={worker.dailyWageRate.average}
                          onChange={(e) => handleWageRateChange(worker.id, 'average', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-0 text-center">
                        <input
                          type="text" 
                          className="w-full h-full border-none outline-none bg-transparent text-center"
                          value={worker.dailyWageRate.high}
                          onChange={(e) => handleWageRateChange(worker.id, 'high', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-0 text-center">
                        <input
                          type="text" 
                          className="w-full h-full border-none outline-none bg-transparent text-center"
                          value={worker.dailyWageRate.low}
                          onChange={(e) => handleWageRateChange(worker.id, 'low', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-0 text-center">
                        {isFirstInTradeGroup ? <span className="font-bold">{worker.id}</span> : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reference note at bottom as shown in the image */}
          <div className="mt-6 text-xs text-gray-700">
            <p>* Please refer to DEVB TCW No. 9/2017 for trade list</p>
          </div>
          
          {/* Add Row button */}
          <div className="mt-4">
                      <button 
                        onClick={handleAddRow}
              className="flex items-center px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      >
              <RiAddLine className="mr-1" />
                        Add Row
                      </button>
                    </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-t border-[#334155] flex justify-end items-center">
        <div className="text-xs text-white opacity-70 mr-auto">
          <div>* Please refer to DEVB TCW No. 9/2017 for trade list</div>
        </div>
      </div>
    </div>
  );
};