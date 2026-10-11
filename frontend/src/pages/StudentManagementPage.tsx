import React, { useState, useEffect } from 'react';
import { studentService } from '../services/studentService';
import { Student } from '../types';
import { StudentModal } from '../components/StudentModal';
import { formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Mail,
  Phone,
  GraduationCap
} from 'lucide-react';

export const StudentManagementPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [academicYear, setAcademicYear] = useState('All');
  const [faceStatus, setFaceStatus] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.getStudents({
        search,
        department: department !== 'All' ? department : undefined,
        year: academicYear !== 'All' ? academicYear : undefined,
        face_status: faceStatus !== 'All' ? faceStatus : undefined,
      });
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [department, academicYear, faceStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleSaveStudent = async (studentData: Partial<Student>) => {
    if (selectedStudent) {
      await studentService.updateStudent(selectedStudent.id, studentData);
    } else {
      await studentService.createStudent(studentData);
    }
    await fetchStudents();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      setDeleteLoading(true);
      await studentService.deleteStudent(deletingStudent.id);
      setDeletingStudent(null);
      await fetchStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Student Biometric Directory</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {students.length} Students
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage student records, academic departments, and facial biometric enrollment statuses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStudents}
            className="p-2 rounded-xl bg-[#11162b] border border-[#1f294d] text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[#11162b] border border-[#1f294d] p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, roll no, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Departments</option>
              <option value="Computer Applications">Computer Applications</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Science">Data Science</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
            </select>
          </div>

          {/* Biometrics Status Filter */}
          <div>
            <select
              value={faceStatus}
              onChange={(e) => setFaceStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Face Statuses</option>
              <option value="enrolled">Enrolled Only</option>
              <option value="pending">Pending Enrollment</option>
            </select>
          </div>
        </form>
      </div>

      {/* Students Data Table */}
      <div className="rounded-2xl bg-[#11162b] border border-[#1f294d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1022] text-slate-400 font-semibold border-b border-[#1f294d]">
              <tr>
                <th className="py-3 px-4">Student Profile</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Department & Class</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Biometric Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f294d]/50 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-[#161d38]/50 transition-colors">
                    {/* Student Profile Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.full_name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            student.first_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{student.full_name}</p>
                          <p className="text-[11px] text-slate-400">{student.gender}</p>
                        </div>
                      </div>
                    </td>

                    {/* Roll Number */}
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-300">
                      {student.student_id}
                    </td>

                    {/* Department & Class */}
                    <td className="py-3 px-4">
                      <p className="text-slate-200 font-medium">{student.department}</p>
                      <p className="text-[11px] text-slate-400">
                        {student.academic_year} • {student.semester} (Sec {student.section})
                      </p>
                    </td>

                    {/* Contact Details */}
                    <td className="py-3 px-4">
                      <p className="text-slate-300 flex items-center space-x-1 truncate max-w-[170px]">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{student.email}</span>
                      </p>
                      {student.phone && (
                        <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{student.phone}</span>
                        </p>
                      )}
                    </td>

                    {/* Biometric Status */}
                    <td className="py-3 px-4">
                      {student.is_face_registered ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending Face
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(student.created_at)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Link to Face Enrollment Studio */}
                        <Link
                          to={`/register-face?student_id=${student.id}`}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            student.is_face_registered
                              ? 'bg-[#0a0d18] border-[#1f294d] text-slate-400 hover:text-white hover:border-indigo-500'
                              : 'bg-indigo-600/20 border-indigo-500 text-indigo-300 hover:bg-indigo-600/30 animate-pulse'
                          }`}
                          title={student.is_face_registered ? 'Re-enroll Face' : 'Enroll Face Biometrics'}
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </Link>

                        {/* View Profile */}
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="p-1.5 rounded-lg bg-[#0a0d18] border border-[#1f294d] text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Student */}
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg bg-[#0a0d18] border border-[#1f294d] text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Student */}
                        <button
                          onClick={() => setDeletingStudent(student)}
                          className="p-1.5 rounded-lg bg-[#0a0d18] border border-[#1f294d] text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No students found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Add/Edit Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStudent}
        student={selectedStudent}
      />

      {/* Student Profile Drawer / Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#11162b] border border-[#1f294d] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-white text-xl font-bold">
                  {viewingStudent.first_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{viewingStudent.full_name}</h2>
                  <p className="text-xs font-mono text-indigo-400">{viewingStudent.student_id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#0a0d18]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1f294d] text-xs">
              <div className="flex justify-between py-1 border-b border-[#1f294d]/40">
                <span className="text-slate-400">Department</span>
                <span className="text-white font-medium">{viewingStudent.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f294d]/40">
                <span className="text-slate-400">Academic Year</span>
                <span className="text-white font-medium">{viewingStudent.academic_year}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f294d]/40">
                <span className="text-slate-400">Semester & Section</span>
                <span className="text-white font-medium">{viewingStudent.semester} (Sec {viewingStudent.section})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f294d]/40">
                <span className="text-slate-400">Email</span>
                <span className="text-white font-medium">{viewingStudent.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f294d]/40">
                <span className="text-slate-400">Phone</span>
                <span className="text-white font-medium">{viewingStudent.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f294d]/40">
                <span className="text-slate-400">Biometric Profile</span>
                <span className={`font-semibold ${viewingStudent.is_face_registered ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {viewingStudent.is_face_registered ? '128-D Biometrics Enrolled' : 'Pending Enrollment'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex space-x-2">
              <Link
                to={`/register-face?student_id=${viewingStudent.id}`}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold text-center shadow-md shadow-indigo-600/25"
                onClick={() => setViewingStudent(null)}
              >
                {viewingStudent.is_face_registered ? 'Update Biometrics' : 'Enroll Biometrics Now'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#11162b] border border-[#1f294d] shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Student?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to delete <span className="font-bold text-white">{deletingStudent.full_name}</span> ({deletingStudent.student_id})?
              All enrolled facial biometric vectors and attendance history will also be removed.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#1f294d]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
