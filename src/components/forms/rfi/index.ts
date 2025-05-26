import MaterialChangeRequest from './MaterialChangeRequest';
import DesignClarificationRequest from './DesignClarificationRequest';
import InspectionRequest from './InspectionRequest';
import SiteIssueReport from './SiteIssueReport';
import MethodStatementSubmission from './MethodStatementSubmission';
import DelayNotification from './DelayNotification';
import ConstructionVariationRequest from './ConstructionVariationRequest';

export {
  MaterialChangeRequest,
  DesignClarificationRequest,
  InspectionRequest,
  SiteIssueReport,
  MethodStatementSubmission,
  DelayNotification,
  ConstructionVariationRequest
};

export const RfiForms = [
  {
    id: 'information-exchange',
    title: 'Information Exchange Request',
    description: 'Request information in compliance with ISO19650 DWSS standards',
    component: DesignClarificationRequest
  },
  {
    id: 'common-data-environment',
    title: 'CDE Document Review',
    description: 'Review documents in the Common Data Environment as per ISO19650',
    component: MaterialChangeRequest
  },
  {
    id: 'design-review',
    title: 'Design Review Request',
    description: 'Request design review based on ISO19650 federation strategy',
    component: InspectionRequest
  },
  {
    id: 'drawing-clarification',
    title: 'Drawing Clarification',
    description: 'Request clarification on drawings following DWSS requirements',
    component: SiteIssueReport
  },
  {
    id: 'workflow-status-change',
    title: 'Workflow Status Change',
    description: 'Request to change document workflow status in the CDE',
    component: MethodStatementSubmission
  },
  {
    id: 'technical-query',
    title: 'Technical Query',
    description: 'Submit technical queries according to ISO19650 Hong Kong standards',
    component: DelayNotification
  },
  {
    id: 'model-coordination',
    title: 'Model Coordination Issue',
    description: 'Report BIM model coordination issues as per DWSS guidelines',
    component: ConstructionVariationRequest
  }
]; 