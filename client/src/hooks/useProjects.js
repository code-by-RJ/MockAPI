import { useState, useCallback, useEffect } from 'react';
import axios from '../lib/axios';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/projects');
      setProjects(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch projects';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData) => {
    try {
      const { data } = await axios.post('/api/projects', projectData);
      setProjects((prev) => [...prev, data]);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create project';
      setError(message);
      throw err;
    }
  }, []);

  const updateProject = useCallback(async (projectId, projectData) => {
    try {
      const { data } = await axios.put(`/api/projects/${projectId}`, projectData);
      setProjects((prev) => prev.map((p) => (p._id === projectId ? data : p)));
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update project';
      setError(message);
      throw err;
    }
  }, []);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await axios.delete(`/api/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete project';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
