import { Router, Response } from 'express';
import { db, LearningMaterial } from '../db.js';
import { authMiddleware, requireTeacher, AuthRequest } from '../auth.js';

const router = Router();

// List materials
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let materials = db.getMaterials();

  if (user.role === 'student') {
    // Only materials assigned to their class or 'all'
    materials = materials.filter(m => m.classId === 'all' || m.classId === user.classId);
  }

  const { topic, classId, search } = req.query;
  if (topic && typeof topic === 'string' && topic !== 'all') {
    materials = materials.filter(m => m.topic.toLowerCase() === topic.toLowerCase());
  }
  if (user.role === 'teacher' && classId && typeof classId === 'string' && classId !== 'all') {
    materials = materials.filter(m => m.classId === classId || m.classId === 'all');
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    materials = materials.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.topic.toLowerCase().includes(q)
    );
  }

  const classes = db.getClasses();
  const result = materials.map(m => ({
    ...m,
    className: m.classId === 'all' ? 'Tất cả các lớp' : classes.find(c => c.id === m.classId)?.name || 'Lớp học',
  }));

  res.json(result);
});

// Get single material
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const material = db.getMaterials().find(m => m.id === id);
  if (!material) {
    return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  }

  if (req.user!.role === 'student' && material.classId !== 'all' && material.classId !== req.user!.classId) {
    return res.status(403).json({ error: 'Tài liệu này không thuộc lớp của bạn' });
  }

  res.json(material);
});

// Create material (Teacher only)
router.post('/', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { title, description, topic, classId, fileType, fileName, fileSize, fileContent, url } = req.body;

  if (!title || !topic || !classId) {
    return res.status(400).json({ error: 'Vui lòng nhập tên tài liệu, chủ đề và lớp áp dụng' });
  }

  const newMaterial: LearningMaterial = {
    id: `mat-${Date.now()}`,
    title: title.trim(),
    description: (description || '').trim(),
    topic: topic.trim(),
    classId,
    fileType: fileType || 'text',
    fileName: fileName || `${title.replace(/\s+/g, '_')}.txt`,
    fileSize: fileSize || 'Vừa cập nhật',
    fileContent: fileContent || '',
    url: url || '',
    teacherId: req.user!.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addMaterial(newMaterial);
  res.status(201).json(newMaterial);
});

// Update material (Teacher only)
router.put('/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getMaterials().find(m => m.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  }

  const { title, description, topic, classId, fileType, fileName, fileContent, url } = req.body;
  const updates: Partial<LearningMaterial> = {};
  if (title) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (topic) updates.topic = topic.trim();
  if (classId) updates.classId = classId;
  if (fileType) updates.fileType = fileType;
  if (fileName) updates.fileName = fileName;
  if (fileContent !== undefined) updates.fileContent = fileContent;
  if (url !== undefined) updates.url = url;

  db.updateMaterial(id, updates);
  res.json({ message: 'Cập nhật tài liệu thành công', material: { ...existing, ...updates } });
});

// Delete material (Teacher only)
router.delete('/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getMaterials().find(m => m.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
  }

  db.deleteMaterial(id);
  res.json({ message: 'Đã xóa tài liệu thành công' });
});

export default router;
