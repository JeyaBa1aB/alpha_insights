import React, { useState } from 'react';
import '../../App.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
}

const mockUsers: User[] = [
  { id: 1, name: 'Jane Doe', email: 'jane@email.com', role: 'admin', status: 'active' },
  { id: 2, name: 'John Smith', email: 'john@email.com', role: 'user', status: 'active' },
  { id: 3, name: 'Alice Lee', email: 'alice@email.com', role: 'user', status: 'inactive' },
  { id: 4, name: 'Bob Brown', email: 'bob@email.com', role: 'user', status: 'active' },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editId, setEditId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || user.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleEdit = (id: number, role: 'user' | 'admin') => {
    setEditId(id);
    setEditRole(role);
  };

  const handleSave = () => {
    setUsers(users.map(user => user.id === editId ? { ...user, role: editRole } : user));
    setEditId(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">User Management</h1>
      <div className="glassmorphic-card p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="input"
        />
        <select value={filter} onChange={e => setFilter(e.target.value as any)} className="input">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="glassmorphic-card p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  {editId === user.id ? (
                    <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className="input">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td>{user.status}</td>
                <td>
                  {editId === user.id ? (
                    <button className="gradient-btn mr-2" onClick={handleSave}>Save</button>
                  ) : (
                    <button className="gradient-btn" onClick={() => handleEdit(user.id, user.role)}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
