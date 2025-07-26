import React, { useState } from 'react';

const mockUser = {
  name: 'Jane Doe',
  email: 'jane.doe@email.com',
  theme: 'light',
};

export default function ProfileSettings() {
  const [user, setUser] = useState(mockUser);
  const [password, setPassword] = useState('');
  const [theme, setTheme] = useState(user.theme);
  const [message, setMessage] = useState('');

  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleThemeChange = (e) => setTheme(e.target.value);

  const handleSave = (e) => {
    e.preventDefault();
    setUser({ ...user, theme });
    setMessage('Settings updated!');
    setPassword('');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Profile & Settings</h1>
      <div className="glassmorphic-card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">User Info</h2>
        <div className="mb-2">Name: <span className="font-medium">{user.name}</span></div>
        <div className="mb-2">Email: <span className="font-medium">{user.email}</span></div>
      </div>
      <form className="glassmorphic-card p-6 flex flex-col gap-4" onSubmit={handleSave}>
        <h2 className="text-xl font-semibold mb-2">Update Password</h2>
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="New Password"
          className="input"
        />
        <h2 className="text-xl font-semibold mb-2">Theme</h2>
        <select value={theme} onChange={handleThemeChange} className="input">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        <button type="submit" className="gradient-btn">Save Settings</button>
        {message && <div className="text-green-500 mt-2">{message}</div>}
      </form>
    </div>
  );
}
