import Course from "../model/course_model.js";
import User from "../model/user_model.js";

export const addCourse = async (req, res) => {
  try {
    console.log("[CourseController] addCourse called. Payload received:", req.body);
    const { title, description, link, category, instructorId, duration, assignedOrphan } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!link) missingFields.push('link');
    if (!category) missingFields.push('category');

    if (missingFields.length > 0) {
      console.warn(`[CourseController] Validation failed. Missing fields: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        success: false, 
        message: `Validation failed: Missing required fields: ${missingFields.join(', ')}`,
        missingFields 
      });
    }

    let user;
    let actualInstructorId = instructorId;

    if (!instructorId || instructorId === 'admin-fixed-id') {
      user = await User.findOne({ role: 'admin' });
      if (!user) {
        // Automatically create and seed the Admin user in the database if they do not exist
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(10);
        const hashedPassword = await bcrypt.default.hash('Lakki123,.', salt);
        user = new User({
          username: 'Admin Nasir',
          email: 'nasirzia171@gmail.com',
          password: hashedPassword,
          role: 'admin',
          status: 'verified'
        });
        await user.save();
        console.log("Dynamically seeded Admin user in DB!");
      }
      actualInstructorId = user._id;
    } else {
      user = await User.findById(instructorId);
    }

    if (!user) {
      console.error(`[CourseController] Instructor not found for ID: ${instructorId}`);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Auto-approve all courses so they show up immediately for orphans
    const status = 'approved';

    const newCourse = new Course({
      title,
      description,
      link,
      category,
      instructor: actualInstructorId,
      instructorName: user.username,
      status,
      duration: duration || 'N/A',
      assignedOrphan: (assignedOrphan && assignedOrphan !== 'all') ? assignedOrphan : null,
      progress: 0
    });

    await newCourse.save();
    console.log("[CourseController] Course saved successfully in DB:", newCourse);
    res.status(201).json({ success: true, course: newCourse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getApprovedCourses = async (req, res) => {
  try {
    // Auto-approve any pending courses so previously added courses show up instantly
    await Course.updateMany({ status: 'pending' }, { status: 'approved' });

    const { orphanId } = req.query;
    let query = { status: 'approved' };

    if (orphanId) {
      query.$or = [
        { assignedOrphan: null },
        { assignedOrphan: { $exists: false } },
        { assignedOrphan: orphanId }
      ];
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPendingCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const course = await Course.findByIdAndUpdate(id, { status }, { new: true });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDonorCourses = async (req, res) => {
  try {
    const { donorId } = req.params;
    const courses = await Course.find({ instructor: donorId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
