const API_BASE_URL = '/api';

class ApiClient {
  async checkConfig() {
    const response = await fetch(`${API_BASE_URL}/config`);
    if (!response.ok) {
      throw new Error('Failed to check configuration');
    }
    return response.json();
  }

  async saveConfig(config) {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packager_mode: config.packager_mode || 'sandbox',
        t_number: config.tNumber,
        api_key: config.apiKey,
        endpoint: config.endpoint,
        model_name: config.modelName,
        api_version: config.version
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save configuration');
    }
    return response.json();
  }

  async uploadFiles(files, mode = 'single') {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('files', files);
    }

    formData.append('mode', mode);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload files');
    }

    return response.json();
  }

  async startProcessing(sessionId) {
    const response = await fetch(`${API_BASE_URL}/process/${sessionId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start processing');
    }

    return response.json();
  }

  async getProgress(sessionId) {
    const response = await fetch(`${API_BASE_URL}/progress/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get progress');
    }

    return response.json();
  }

  async getResults(sessionId) {
    const response = await fetch(`${API_BASE_URL}/results/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get results');
    }

    return response.json();
  }

  async downloadFile(filename) {
    const response = await fetch(`${API_BASE_URL}/download/${filename}`);

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient();