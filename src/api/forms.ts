import axios from 'axios';

const API_BASE_URL = 'https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run';

export interface FormResponse {
  id: string;
  project_id: string;
  created_by: {
    name: string;
    email: string;
  };
  name: string;
  description: string;
  form_type: string;
  priority: string;
  status: string;
  file_url: string;
  response_url: string | null;
  created_at: string;
  updated_at: string;
  form_assignments?: {
    users: {
      name: string;
      email: string;
    };
    user_id: string;
  }[];
}

export const createForm = async (
  pdf: File,
  uid: string,
  name: string,
  description: string,
  assign: string[],
  project_id: string,
  priority: string,
  type_of_form: string
) => {
  const formData = new FormData();
  formData.append('pdf', pdf);
  formData.append('uid', uid);
  formData.append('name', name);
  formData.append('description', description);
  formData.append('assign', JSON.stringify(assign));
  formData.append('project_id', project_id);
  formData.append('priority', priority);
  formData.append('type_of_form', type_of_form);

  const response = await axios.post(`${API_BASE_URL}/api/forms/createform`, formData);
  return response.data;
};

export const getForms = async (uid: string, project_id: string, form_type: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/forms/getforms?uid=${uid}&project_id=${project_id}&form_type=${form_type}`
  );
  return response.data as FormResponse[];
};

export const respondToForm = async (
  form_id: string,
  pdf: File,
  uid: string,
  project_id: string
) => {
  const formData = new FormData();
  formData.append('pdf', pdf);
  formData.append('uid', uid);
  formData.append('project_id', project_id);

  const response = await axios.post(
    `${API_BASE_URL}/api/forms/respond/${form_id}`,
    formData
  );
  return response.data;
};

export const updateFormStatus = async (
  form_id: string,
  uid: string,
  status: string
) => {
  const response = await axios.patch(
    `${API_BASE_URL}/api/forms/status/${form_id}`,
    {
      uid,
      status
    }
  );
  return response.data;
}; 