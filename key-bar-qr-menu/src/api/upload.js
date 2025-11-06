import api from './index';

// UPLOADS (изображения блюд)
export const uploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  deleteImage: (filename) => api.delete(`/upload/${filename}`),
};