import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { Company } from '../../lib/database.types';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    hr_name: '',
    hr_email: '',
    hr_contact: '',
    description: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    const response = await apiGet<{ data: Company[] }>('/companies');
    setCompanies(response.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCompany) {
      try {
        await apiPatch(`/companies/${editingCompany.id}`, { data: formData });
        resetForm();
        await loadCompanies();
      } catch (error) {
        console.error('Update company failed:', error);
      }
    } else {
      try {
        await apiPost('/companies', { data: formData });
        resetForm();
        await loadCompanies();
      } catch (error) {
        console.error('Create company failed:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      try {
        await apiDelete(`/companies/${id}`);
        await loadCompanies();
      } catch (error) {
        console.error('Delete company failed:', error);
      }
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      website: company.website || '',
      hr_name: company.hr_name || '',
      hr_email: company.hr_email || '',
      hr_contact: company.hr_contact || '',
      description: company.description || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      hr_name: '',
      hr_email: '',
      hr_contact: '',
      description: '',
    });
    setEditingCompany(null);
    setShowModal(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading companies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Company Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Company
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(company)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {company.website && (
                <p className="text-gray-600">
                  <span className="font-medium">Website:</span>{' '}
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {company.website}
                  </a>
                </p>
              )}
              {company.hr_name && (
                <p className="text-gray-600">
                  <span className="font-medium">HR:</span> {company.hr_name}
                </p>
              )}
              {company.hr_email && (
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {company.hr_email}
                </p>
              )}
              {company.hr_contact && (
                <p className="text-gray-600">
                  <span className="font-medium">Contact:</span> {company.hr_contact}
                </p>
              )}
              {company.description && (
                <p className="text-gray-600 mt-2">{company.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingCompany ? 'Edit Company' : 'Add Company'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HR Name</label>
                  <input
                    type="text"
                    value={formData.hr_name}
                    onChange={(e) => setFormData({ ...formData, hr_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HR Email</label>
                  <input
                    type="email"
                    value={formData.hr_email}
                    onChange={(e) => setFormData({ ...formData, hr_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">HR Contact</label>
                  <input
                    type="tel"
                    value={formData.hr_contact}
                    onChange={(e) => setFormData({ ...formData, hr_contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCompany ? 'Update' : 'Add'} Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
